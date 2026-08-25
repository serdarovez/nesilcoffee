import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, filledLocales } from "@/lib/i18n-field";
import { PageShell, PageHeader, EmptyState } from "@/components/admin/ui";
import { CategoriesManager, type CategoryRow } from "@/components/admin/CategoriesManager";

export const metadata: Metadata = { title: "Категории" };

export default async function CategoriesPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: { where: { deletedAt: null } } } },
    },
  });

  const rows: CategoryRow[] = categories.map((c) => ({
    id: c.id,
    name: pick(c.name, "ru"),
    slug: c.slug,
    productCount: c._count.products,
    isActive: c.isActive,
    filledNameLocales: filledLocales(c.name),
  }));

  return (
    <PageShell>
      <PageHeader
        title="Категории"
        description="Перетащите за рукоятку, чтобы изменить порядок. Каждая категория — отдельный блок на странице продукции; порядок здесь определяет, чьи товары показываются первыми на сайте."
        action={{ href: "/admin/categories/new", label: "Добавить категорию" }}
      />

      {rows.length === 0 ? (
        <EmptyState message="Пока нет категорий" />
      ) : (
        <CategoriesManager categories={rows} />
      )}
    </PageShell>
  );
}
