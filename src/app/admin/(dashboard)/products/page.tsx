import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, filledLocales } from "@/lib/i18n-field";
import { PageShell, PageHeader, EmptyState } from "@/components/admin/ui";
import { ProductsManager, type ProductRow } from "@/components/admin/ProductsManager";
import {
  parseFieldRules,
  applyFieldRules,
  missingRequired,
  fieldLabel,
} from "@/lib/category-fields";
import { formatWeight } from "@/lib/product-rules";

export const metadata: Metadata = { title: "Продукция" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ trash?: string }>;
}) {
  await requireAdmin();
  const { trash } = await searchParams;
  const showTrash = trash === "1";

  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: showTrash ? { deletedAt: { not: null } } : { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { image: true },
      },
    },
  });

  const trashCount = await prisma.product.count({
    where: { deletedAt: { not: null } },
  });
  const total = categories.reduce((n, c) => n + c.products.length, 0);

  return (
    <PageShell>
      <PageHeader
        title="Продукция"
        description={
          showTrash
            ? "Удалённые товары. Их можно восстановить."
            : "Товары сгруппированы по категориям — порядок здесь определяет порядок на сайте."
        }
        action={showTrash ? undefined : { href: "/admin/products/new", label: "Добавить товар" }}
      />

      <div className="mb-4 flex gap-2 text-sm">
        <Link
          href="/admin/products"
          className={
            showTrash
              ? "text-ink-3 hover:text-ink"
              : "font-semibold text-ink underline underline-offset-4"
          }
        >
          Активные
        </Link>
        <Link
          href="/admin/products?trash=1"
          className={
            showTrash
              ? "font-semibold text-ink underline underline-offset-4"
              : "text-ink-3 hover:text-ink"
          }
        >
          Корзина{trashCount > 0 ? ` (${trashCount})` : ""}
        </Link>
      </div>

      {total === 0 ? (
        <EmptyState
          message={showTrash ? "Корзина пуста" : "Пока нет товаров"}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {categories
            .filter((c) => c.products.length > 0)
            .map((category) => {
              const rules = parseFieldRules(category.fieldRules);
              const rows: ProductRow[] = category.products.map((product) => {
                // Recomputed per render, not stored: a category rule change
                // must show up immediately without rewriting every row.
                const missing = missingRequired(rules, product);
                // Blank out fields the category switches off, exactly as the
                // site does, so a stored roast on a tea is not listed here when
                // that category doesn't use roast.
                const spec = applyFieldRules(rules, product);
                const specLine = [
                  spec.weight ? formatWeight(spec.weight, "г") : null,
                  spec.arabica ? `${spec.arabica} арабика` : null,
                  spec.roast !== null ? `обжарка ${spec.roast}/5` : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return {
                  id: product.id,
                  name: pick(product.name, "ru"),
                  specLine,
                  imagePath: product.image?.path ?? null,
                  isActive: product.isActive,
                  isDeleted: Boolean(product.deletedAt),
                  missingLabel:
                    missing.length > 0
                      ? `Заполните: ${missing.map(fieldLabel).join(", ").toLowerCase()}`
                      : null,
                  filledNameLocales: filledLocales(product.name),
                };
              });
              return (
                <ProductsManager
                  key={category.id}
                  categoryName={pick(category.name, "ru")}
                  products={rows}
                  sortable={!showTrash}
                />
              );
            })}
        </div>
      )}
    </PageShell>
  );
}
