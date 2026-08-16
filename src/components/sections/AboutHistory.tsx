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
    <section className="mx-auto w-full max-w-378 px-5 pt-16 md:px-9 md:pt-32">
      {/* Header row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="flex flex-col gap-4 md:flex-1 md:flex-row md:items-start md:gap-26">
          <h2 className="font-display font-extrabold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em] md:w-157.25 md:text-[96px] md:leading-[97%] md:tracking-[-0.035em]">
            {t.rich("title", {
              a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
            })}
          </h2>
          <p className="font-display text-lg font-bold uppercase text-[#1a1a1a] leading-[120%] md:w-119.5 md:pt-2 md:text-4xl md:leading-[110%]">
            {t.rich("subtitle", {
              a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
            })}
          </p>
        </div>
        <div className="flex shrink-0 gap-2 md:gap-4 md:pt-6">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#d8d8d8] text-[#1a1a1a] transition-colors hover:bg-[#c0c0c0] cursor-pointer md:h-12 md:w-12"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#141414] text-white transition-colors hover:bg-black cursor-pointer md:h-12 md:w-12"
          >
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
      </div>

      <div className="mt-6 border-t border-[#d9d9d9] md:mt-10" />

      <div className="mt-6 overflow-hidden md:mt-10" ref={emblaRef}>
        <div className="flex gap-4 md:gap-8">
          {HISTORY_CARDS.map((card) => (
            <article
              key={card.key}
              className="flex flex-[0_0_100%] min-w-0 flex-col gap-4 md:flex-[0_0_1099px] md:shrink-0 md:gap-6"
            >
              <h3 className="font-display text-2xl font-extrabold uppercase text-[#1a1a1a] leading-[110%] md:text-6xl md:leading-[97%]">
                {t(`cards.${card.key}.title`)}
              </h3>
              <div className="flex flex-col gap-4 md:h-128.5 md:flex-row md:gap-6">
                <div className="relative h-[220px] w-full shrink-0 overflow-hidden rounded-2xl bg-[#dedede] md:h-full md:w-178.5 md:rounded-3xl">
                  <BlurImage
                    src={card.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 714px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-end md:pb-4">
                  <p className="text-sm leading-[140%] text-[#1a1a1a] md:text-xl md:leading-[130%]">
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
