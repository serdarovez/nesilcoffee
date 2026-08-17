"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Trash2, Pencil } from "lucide-react";
import { SortableList } from "./SortableList";
import {
  reorderHeroSlides,
  toggleHeroSlide,
  deleteHeroSlide,
} from "@/server/actions/carousels";

export type HeroSlideRow = {
  id: string;
  title: string;
  bgPath: string | null;
  artPath: string | null;
  overlayColor: string;
  overlayOpacity: number;
  isActive: boolean;
};

export function HeroCarouselManager({ slides }: { slides: HeroSlideRow[] }) {
  const byId = new Map(slides.map((s) => [s.id, s]));
  const [pending, startTransition] = useTransition();

  return (
    <SortableList ids={slides.map((s) => s.id)} onReorder={reorderHeroSlides}>
      {(id, index) => {
        const slide = byId.get(id);
        if (!slide) return null;

        return (
          <div className="flex items-center gap-3">
            <span className="w-5 shrink-0 text-center text-xs font-semibold text-ink-4 tabular-nums">
              {index + 1}
            </span>

            {/* Thumbnail composites background, tint and product art the same
             * way the live slide does, so the list reads as a real preview. */}
            <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-paper-mute">
              {slide.bgPath && (
                <Image
                  src={slide.bgPath}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: slide.overlayColor,
                  opacity: slide.overlayOpacity / 100,
                }}
              />
              {slide.artPath && (
                <Image
                  src={slide.artPath}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-contain p-1"
                />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="line-clamp-1 text-sm font-medium text-ink">
                {slide.title}
              </span>
              <span className="text-xs text-ink-4">
                {slide.overlayColor} · {slide.overlayOpacity}%
                {slide.isActive ? "" : " · скрыт"}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <Link
                href={`/admin/carousel-products/${slide.id}`}
                title="Редактировать"
                className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-paper-alt hover:text-ink"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await toggleHeroSlide(slide.id);
                  })
                }
                title={slide.isActive ? "Скрыть" : "Показать"}
                className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-paper-alt hover:text-ink"
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
                    await deleteHeroSlide(slide.id);
                  })
                }
                title="Удалить слайд"
                className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-paper-alt hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      }}
    </SortableList>
  );
}
