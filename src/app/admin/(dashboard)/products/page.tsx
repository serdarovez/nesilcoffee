import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, filledLocales, LOCALE_ORDER } from "@/lib/i18n-field";
import { PageShell, PageHeader, EmptyState, StatusDot, LocaleBadges } from "@/components/admin/ui";
import { RowActions } from "@/components/admin/RowActions";
import {
  toggleProduct,
  deleteProduct,
  restoreProduct,
  moveProduct,
} from "@/server/actions/products";
import { NO_IMAGE_REASON } from "@/lib/product-rules";
import {
  parseFieldRules,
  missingRequired,
  fieldLabel,
} from "@/lib/category-fields";
import { ImageOff, AlertTriangle } from "lucide-react";

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
              return (
              <section key={category.id}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-4">
                  {pick(category.name, "ru")}
                </h2>
                <div className="overflow-hidden rounded-xl border border-line bg-paper">
                  {category.products.map((product, index) => {
                    // Recomputed per render rather than stored: a category rule
                    // change must show up here immediately, without touching
                    // every product row in the database.
                    const missing = missingRequired(rules, product);
                    return (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0"
                    >
                      <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-paper-alt">
                        {product.image ? (
                          <Image
                            src={product.image.path}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-contain p-0.5"
                          />
                        ) : (
                          <ImageOff
                            className="h-4 w-4 text-ink-5"
                            aria-label="Нет фотографии"
                          />
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                          <StatusDot active={product.isActive} />
                          {pick(product.name, "ru")}
                        </span>
                        <span className="truncate text-xs text-ink-4">
                          {product.weight}
                          {product.arabica ? ` · ${product.arabica} арабика` : ""}
                          {" · обжарка "}
                          {product.roast}/5
                        </span>
                        {/* Stated on the row rather than only in the toggle's
                         * tooltip: this is why the product is off the site,
                         * and it is not discoverable by hovering. */}
                        {!product.image && (
                          <span className="inline-flex w-fit items-center gap-1 rounded bg-danger/10 px-1.5 py-0.5 text-[11px] font-medium text-danger">
                            <ImageOff className="h-3 w-3 shrink-0" />
                            Нет фотографии — скрыт с сайта
                          </span>
                        )}
                        {/* A warning, not a block: unlike a missing photo, a
                         * missing spec just means the card shows one fewer
                         * line. The product stays on the site. */}
                        {missing.length > 0 && (
                          <span className="inline-flex w-fit items-center gap-1 rounded bg-warning-tint px-1.5 py-0.5 text-[11px] font-medium text-warning">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            Заполните: {missing.map(fieldLabel).join(", ").toLowerCase()}
                          </span>
                        )}
                      </div>

                      <div className="hidden shrink-0 sm:block">
                        <LocaleBadges
                          filled={filledLocales(product.name)}
                          all={LOCALE_ORDER}
                        />
                      </div>

                      <RowActions
                        editHref={`/admin/products/${product.id}`}
                        isActive={product.isActive}
                        isDeleted={Boolean(product.deletedAt)}
                        canMoveUp={index > 0}
                        canMoveDown={index < category.products.length - 1}
                        onToggle={toggleProduct.bind(null, product.id)}
                        onMoveUp={moveProduct.bind(null, product.id, -1)}
                        onMoveDown={moveProduct.bind(null, product.id, 1)}
                        onDelete={deleteProduct.bind(null, product.id)}
                        onRestore={restoreProduct.bind(null, product.id)}
                        showBlockedReason={
                          product.image ? undefined : NO_IMAGE_REASON
                        }
                        confirmLabel="Удалить?"
                      />
                    </div>
                    );
                  })}
                </div>
              </section>
              );
            })}
        </div>
      )}
    </PageShell>
  );
}
