"use client";

import { SortableList } from "./SortableList";
import { StatusDot, LocaleBadges } from "./ui";
import { RowActions } from "./RowActions";
import { LOCALE_ORDER } from "@/lib/i18n-field";
import {
  reorderCategories,
  toggleCategory,
  deleteCategory,
  restoreCategory,
} from "@/server/actions/categories";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  isActive: boolean;
  filledNameLocales: string[];
};

/**
 * Drag-to-reorder list of categories. The order set here is the order the
 * category blocks appear on the products page, so dragging a category up makes
 * its products show first on the site. Persisted by reorderCategories; the
 * up/down chevrons are hidden since the drag handle replaces them.
 */
export function CategoriesManager({ categories }: { categories: CategoryRow[] }) {
  const byId = new Map(categories.map((c) => [c.id, c]));

  return (
    <SortableList ids={categories.map((c) => c.id)} onReorder={reorderCategories}>
      {(id) => {
        const c = byId.get(id);
        if (!c) return null;
        return (
          <div className="flex items-center gap-3 pr-1">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                <StatusDot active={c.isActive} />
                {c.name}
              </span>
              <span className="truncate text-xs text-ink-4">
                /{c.slug} · {c.productCount} товаров
              </span>
            </div>
            <div className="hidden shrink-0 sm:block">
              <LocaleBadges filled={c.filledNameLocales} all={LOCALE_ORDER} />
            </div>
            <RowActions
              editHref={`/admin/categories/${c.id}`}
              isActive={c.isActive}
              hideMove
              onToggle={toggleCategory.bind(null, c.id)}
              onDelete={deleteCategory.bind(null, c.id)}
              onRestore={restoreCategory.bind(null, c.id)}
              deleteBlockedReason={
                c.productCount > 0
                  ? `Сначала перенесите ${c.productCount} товаров в другую категорию`
                  : undefined
              }
              confirmLabel="Удалить?"
            />
          </div>
        );
      }}
    </SortableList>
  );
}
