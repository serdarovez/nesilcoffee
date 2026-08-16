"use client";
import { useTranslations } from "next-intl";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BlurImage } from "@/components/ui/BlurImage";
import { cn } from "@/lib/utils";

type HistoryCard = { key: "idea" | "search" | "roast" | "launch"; image: string };
const HISTORY_CARDS: HistoryCard[] = [
  { key: "idea",   image: "/sections/about/welcome-a.jpg" },
  // Figma's 2nd card has no resolvable image fill; hero-grid is the only other
  // landscape plantation shot, and history-idea.jpg (1080×1919) was portrait —
  // it cropped badly into this 714×514 slot.
  { key: "search", image: "/sections/about/hero-grid.jpg" },
  { key: "roast",  image: "/sections/about/welcome-b.jpg" },
  { key: "launch", image: "/sections/about/history-search.jpg" },
];

/**
 * Figma "наша история" (2048:5994). Cards were pinned at a literal 1099px
 * basis, which meant the peek of the next card only looked right at the
 * 1512 design width. They now take 76.3% (1099/1440) of the container, so
 * the peek holds at every viewport, and the card's inner split (image
 * 714/1099 = 65%) is a ratio for the same reason.
 *
 * On md+ the section is height-anchored to one `--screen-h`: widths stay on
 * the Figma ratios while the card plate takes its height from what the
 * header row leaves over, so the whole story card fits a single screen.
 */
export function AboutHistory() {
  const t = useTranslations("about.history");
  // Not looped: the design shows the back arrow greyed out on the first
  // card, which only reads as "start of the story" without wraparound.
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [selected, setSelected] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
      setSelected(emblaApi.selectedScrollSnap());
    };
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
  }, [emblaApi]);

  return (
    <section className="container-x section-pt flex flex-col md:min-h-(--screen-h) md:pb-[clamp(24px,5dvh,64px)]">
      {/* Header row */}
      <div className="flex shrink-0 flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-[clamp(16px,2vw,32px)]">
        {/* Widths are ratios of THIS row, not of the section: the arrow
         * cluster is a sibling, so 629/1440 would leave the title too
         * narrow and wrap "НАША ИСТОРИЯ" onto two lines. */}
        <div className="flex flex-col gap-4 md:min-w-0 md:flex-1 md:flex-row md:items-start md:gap-[8%]">
          <h2 className="display-2 font-extrabold text-ink md:w-[48%] md:min-w-0">
            {t.rich("title", {
              a: (chunks) => <span className="text-quiet">{chunks}</span>,
            })}
          </h2>
          <p className="display-4 text-ink md:w-[36.6%] md:min-w-0 md:pt-2">
            {t.rich("subtitle", {
              a: (chunks) => <span className="text-quiet">{chunks}</span>,
            })}
          </p>
        </div>
        <div className="flex shrink-0 gap-2 md:gap-4 md:pt-[clamp(12px,2.4dvh,24px)]">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous"
            className={cn(
              "grid size-10 cursor-pointer place-items-center rounded-full transition-colors md:size-[clamp(40px,5dvh,48px)]",
              canPrev
                ? "bg-paper-darker text-ink-inverse hover:bg-black"
                : "bg-quiet text-ink hover:bg-quiet-hover",
            )}
          >
            <ArrowLeft className="size-4 md:size-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next"
            className={cn(
              "grid size-10 cursor-pointer place-items-center rounded-full transition-colors md:size-[clamp(40px,5dvh,48px)]",
              canNext
                ? "bg-paper-darker text-ink-inverse hover:bg-black"
                : "bg-quiet text-ink hover:bg-quiet-hover",
            )}
          >
            <ArrowRight className="size-4 md:size-5" />
          </button>
        </div>
      </div>

      <div className="mt-6 shrink-0 border-t border-line-strong md:mt-[clamp(24px,5dvh,40px)]" />

      {/* The viewport takes the screen height the header row leaves over and
       * hands it down to the track → card → plate. The chain is flex-1 the
       * whole way, NOT `h-full`: the section is sized by `min-height`, so a
       * percentage height here resolves against an indefinite parent and
       * collapses to auto — which left the plate stuck at its floor with
       * dead space under it. */}
      <div
        className="mt-6 overflow-hidden md:mt-[clamp(24px,5dvh,40px)] md:flex md:min-h-0 md:flex-1 md:flex-col"
        ref={emblaRef}
      >
        <div className="flex gap-4 md:min-h-0 md:flex-1 md:gap-[clamp(20px,2.2vw,32px)]">
          {HISTORY_CARDS.map((card, i) => (
            <article
              key={card.key}
              className={cn(
                "flex min-w-0 flex-[0_0_100%] flex-col gap-4 transition-opacity duration-500 md:flex-[0_0_76.3%] md:gap-[clamp(16px,2.6dvh,24px)]",
                i === selected ? "opacity-100" : "opacity-40",
              )}
            >
              <h3 className="font-display text-2xl font-extrabold uppercase leading-[110%] tracking-[-0.02em] text-ink md:shrink-0 md:text-[clamp(32px,4.4vw,64px)] md:leading-[97%]">
                {t(`cards.${card.key}.title`)}
              </h3>
              <div className="flex flex-col gap-4 md:min-h-0 md:flex-1 md:flex-row md:gap-[clamp(16px,2vw,24px)]">
                <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-2xl bg-paper-mute md:aspect-auto md:min-h-[30dvh] md:w-[65%] md:rounded-3xl">
                  <BlurImage
                    src={card.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-end md:pb-4">
                  <p className="body-md text-ink">
                    {t(`cards.${card.key}.body`)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
