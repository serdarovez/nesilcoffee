"use client";
import { useTranslations } from "next-intl";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BlurImage } from "@/components/ui/BlurImage";

type HistoryCard = { key: "idea" | "search" | "roast" | "launch"; image: string };
const HISTORY_CARDS: HistoryCard[] = [
  { key: "idea",   image: "/sections/about/welcome-a.jpg" },
  { key: "search", image: "/sections/about/history-idea.jpg" },
  { key: "roast",  image: "/sections/about/welcome-b.jpg" },
  { key: "launch", image: "/sections/about/history-search.jpg" },
];

export function AboutHistory() {
  const t = useTranslations("about.history");
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section className="mx-auto w-full max-w-378 px-9 pt-32">
      {/* Header row */}
      <div className="flex items-start justify-between gap-8">
        <div className="flex flex-1 items-start gap-26">
          <h2 className="w-157.25 font-display font-extrabold uppercase text-[#1a1a1a] text-[96px] leading-[97%] tracking-[-0.035em]">
            {t.rich("title", {
              a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
            })}
          </h2>
          <p className="w-119.5 pt-2 font-display text-4xl font-bold uppercase text-[#1a1a1a] leading-[110%]">
            {t.rich("subtitle", {
              a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
            })}
          </p>
        </div>
        <div className="flex shrink-0 gap-4 pt-6">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous"
            className="grid h-12 w-12 place-items-center rounded-full bg-[#d8d8d8] text-[#1a1a1a] transition-colors hover:bg-[#c0c0c0] cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next"
            className="grid h-12 w-12 place-items-center rounded-full bg-[#141414] text-white transition-colors hover:bg-black cursor-pointer"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="mt-10 border-t border-[#d9d9d9]" />

      {/* Cards carousel — matches Figma Frame 222 (1099 × 514, HORIZONTAL gap 24).
          Each card: 1099 wide. Inside: title above + row of image (714) + body copy
          column (361) with body aligned to bottom of image height. */}
      <div className="mt-10 overflow-hidden" ref={emblaRef}>
        <div className="flex gap-8">
          {HISTORY_CARDS.map((card) => (
            <article
              key={card.key}
              className="flex flex-[0_0_1099px] shrink-0 flex-col gap-6"
            >
              <h3 className="font-display text-6xl font-extrabold uppercase text-[#1a1a1a] leading-[97%]">
                {t(`cards.${card.key}.title`)}
              </h3>
              <div className="flex h-128.5 gap-6">
                <div className="relative h-full w-178.5 shrink-0 overflow-hidden rounded-3xl bg-[#dedede]">
                  <BlurImage
                    src={card.image}
                    alt=""
                    fill
                    sizes="714px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-end pb-4">
                  <p className="text-xl leading-[130%] text-[#1a1a1a]">
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
