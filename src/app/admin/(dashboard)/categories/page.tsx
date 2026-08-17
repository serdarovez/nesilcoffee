import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, filledLocales, LOCALE_ORDER } from "@/lib/i18n-field";
import { PageShell, PageHeader, EmptyState, StatusDot, LocaleBadges } from "@/components/admin/ui";
import { RowActions } from "@/components/admin/RowActions";
import {
  toggleCategory,
  deleteCategory,
  restoreCategory,
  moveCategory,
} from "@/server/actions/categories";

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

  return (
    <PageShell>
      <PageHeader
        title="Категории"
        description="Каждая категория — отдельный блок на странице продукции. Порядок здесь определяет порядок блоков."
        action={{ href: "/admin/categories/new", label: "Добавить категорию" }}
      />

      {categories.length === 0 ? (
        <EmptyState message="Пока нет категорий" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-paper">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                  <StatusDot active={category.isActive} />
                  {pick(category.name, "ru")}
                </span>
                <span className="truncate text-xs text-ink-4">
                  /{category.slug} · {category._count.products} товаров
                </span>
              </div>

              <div className="hidden shrink-0 sm:block">
                <LocaleBadges filled={filledLocales(category.name)} all={LOCALE_ORDER} />
              </div>

              <RowActions
                editHref={`/admin/categories/${category.id}`}
                isActive={category.isActive}
                canMoveUp={index > 0}
                canMoveDown={index < categories.length - 1}
                onToggle={toggleCategory.bind(null, category.id)}
                onMoveUp={moveCategory.bind(null, category.id, -1)}
                onMoveDown={moveCategory.bind(null, category.id, 1)}
                onDelete={deleteCategory.bind(null, category.id)}
                onRestore={restoreCategory.bind(null, category.id)}
                deleteBlockedReason={
                  category._count.products > 0
                    ? `Сначала перенесите ${category._count.products} товаров в другую категорию`
                    : undefined
                }
                confirmLabel="Удалить?"
              />
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
