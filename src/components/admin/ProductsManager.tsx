"use client";

import Image from "next/image";
import { ImageOff, AlertTriangle } from "lucide-react";
import { SortableList } from "./SortableList";
import { StatusDot, LocaleBadges } from "./ui";
import { RowActions } from "./RowActions";
import { LOCALE_ORDER } from "@/lib/i18n-field";
import { NO_IMAGE_REASON } from "@/lib/product-rules";
import {
  reorderProducts,
  toggleProduct,
  deleteProduct,
  restoreProduct,
} from "@/server/actions/products";

export type ProductRow = {
  id: string;
  name: string;
  /** Pre-composed "1000 гр · 100% арабика · обжарка 4/5" line. */
  specLine: string;
  imagePath: string | null;
  isActive: boolean;
  isDeleted: boolean;
  /** "Заполните: …" text when required specs are missing, else null. */
  missingLabel: string | null;
  filledNameLocales: string[];
};

/**
 * One category's products. In the active view the grip drags to reorder
 * (persisted per category by reorderProducts) and the up/down chevrons are
 * hidden. The trash view is not sortable — reordering deleted rows is
 * meaningless — so it renders the same rows without a handle.
 */
export function ProductsManager({
  categoryName,
  products,
  sortable,
}: {
  categoryName: string;
  products: ProductRow[];
  sortable: boolean;
}) {
  const byId = new Map(products.map((p) => [p.id, p]));

  const row = (p: ProductRow) => (
    <div className="flex items-center gap-3 pr-1">
      <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-paper-alt">
        {p.imagePath ? (
          <Image src={p.imagePath} alt="" fill sizes="44px" className="object-contain p-0.5" />
        ) : (
          <ImageOff className="h-4 w-4 text-ink-5" aria-label="Нет фотографии" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 truncate text-sm font-medium text-ink">
          <StatusDot active={p.isActive} />
          {p.name}
        </span>
        <span className="truncate text-xs text-ink-4">{p.specLine}</span>
        {!p.imagePath && (
          <span className="inline-flex w-fit items-center gap-1 rounded bg-danger/10 px-1.5 py-0.5 text-[11px] font-medium text-danger">
            <ImageOff className="h-3 w-3 shrink-0" />
            Нет фотографии — скрыт с сайта
          </span>
        )}
        {p.missingLabel && (
          <span className="inline-flex w-fit items-center gap-1 rounded bg-warning-tint px-1.5 py-0.5 text-[11px] font-medium text-warning">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {p.missingLabel}
          </span>
        )}
      </div>

      <div className="hidden shrink-0 sm:block">
        <LocaleBadges filled={p.filledNameLocales} all={LOCALE_ORDER} />
      </div>

      <RowActions
        editHref={`/admin/products/${p.id}`}
        isActive={p.isActive}
        isDeleted={p.isDeleted}
        hideMove
        onToggle={toggleProduct.bind(null, p.id)}
        onDelete={deleteProduct.bind(null, p.id)}
        onRestore={restoreProduct.bind(null, p.id)}
        showBlockedReason={p.imagePath ? undefined : NO_IMAGE_REASON}
        confirmLabel="Удалить?"
      />
    </div>
  );

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-4">
        {categoryName}
      </h2>
      {sortable ? (
        <SortableList ids={products.map((p) => p.id)} onReorder={reorderProducts}>
          {(id) => {
            const p = byId.get(id);
            return p ? row(p) : null;
          }}
        </SortableList>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-line bg-paper py-2.5 pl-3">
              {row(p)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
