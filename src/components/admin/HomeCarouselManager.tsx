"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Trash2, Plus, AlertTriangle, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortableList } from "./SortableList";
import { inputClass } from "./ui";
import {
  reorderHomeSlides,
  toggleHomeSlide,
  deleteHomeSlide,
  addHomeSlide,
} from "@/server/actions/carousels";

export type HomeSlideRow = {
  id: string;
  productId: string;
  productName: string;
  productActive: boolean;
  productDeleted: boolean;
  roast: number | null;
  acidity: number | null;
  /** Image actually rendered — the override when set, otherwise the product's. */
  imagePath: string | null;
  hasOverride: boolean;
  isActive: boolean;
};

export function HomeCarouselManager({
  slides,
  products,
}: {
  slides: HomeSlideRow[];
  products: { id: string; label: string }[];
}) {
  const byId = new Map(slides.map((s) => [s.id, s]));
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <SortableList
        ids={slides.map((s) => s.id)}
        onReorder={reorderHomeSlides}
      >
        {(id, index) => {
          const slide = byId.get(id);
          if (!slide) return null;
          const hidden = !slide.isActive || !slide.productActive || slide.productDeleted;

          return (
            <div className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-center text-xs font-semibold text-ink-4 tabular-nums">
                {index + 1}
              </span>

              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-paper-alt">
                {slide.imagePath && (
                  <Image
                    src={slide.imagePath}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-contain p-0.5"
                  />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-ink">
                  {slide.productName}
                </span>
                <span className="truncate text-xs text-ink-4">
                  {[
                    slide.roast !== null ? `обжарка ${slide.roast}/5` : null,
                    slide.acidity !== null ? `кислотность ${slide.acidity}/5` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "без характеристик"}
                  {slide.hasOverride ? " · своё изображение" : ""}
                </span>

                {slide.productDeleted ? (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-danger">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Товар удалён — слайд не показывается
                  </span>
                ) : !slide.productActive ? (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#8a6d2f]">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Товар скрыт — слайд не показывается
                  </span>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <Link
                  href={`/admin/carousel-home/${slide.id}`}
                  title="Настроить слайд"
                  className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-paper-alt hover:text-ink"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await toggleHomeSlide(slide.id);
                    })
                  }
                  title={slide.isActive ? "Скрыть слайд" : "Показать слайд"}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-md transition-colors hover:bg-paper-alt",
                    hidden ? "text-ink-5" : "text-ink-3 hover:text-ink",
                  )}
                >
                  {slide.isActive ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteHomeSlide(slide.id);
                    })
                  }
                  title="Убрать из карусели"
                  className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-paper-alt hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        }}
      </SortableList>

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-line-strong bg-paper p-4">
        <label className="flex min-w-50 flex-1 flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Добавить слайд</span>
          <select
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            className={inputClass}
          >
            <option value="">Выберите товар…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!adding || pending}
          onClick={() =>
            startTransition(async () => {
              await addHomeSlide(adding);
              setAdding("");
            })
          }
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-paper-dark px-4 text-sm font-medium text-ink-inverse transition-colors hover:bg-brand-coffee disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </button>
      </div>
    </div>
  );
}
