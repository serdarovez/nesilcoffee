"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BLOCKS = [
  { key: "capacity", image: "/sections/production/stage-1.jpg" },
  { key: "organic", image: "/sections/production/stage-2.jpg" },
  { key: "italian", image: "/sections/production/stage-3.jpg" },
  { key: "certified", image: "/sections/production/stage-4.jpg" },
] as const;

export function ProductionProcess() {
  const t = useTranslations("home.production");

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selected, setSelected] = useState(0);

  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  return (
    <section id="production" className="mx-auto w-full max-w-378 px-9 pt-32">
      <h2 className="max-w-219.75 font-display font-bold uppercase text-[#1a1a1a] text-[96px] leading-[97%] tracking-[-0.035em]">
        {t.rich("sectionTitle", {
          a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
        })}
      </h2>

      <div className="relative mt-10">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {BLOCKS.map((b) => (
              <div key={b.key} className="flex-[0_0_100%] min-w-0">
                <div className="flex items-center gap-32">
                  <div className="flex w-125 flex-col gap-6">
                    <h3 className="text-5xl font-medium leading-[100%] text-[#1a1a1a]">
                      {t(`blocks.${b.key}.title`)}
                    </h3>
                    <div className="flex flex-col gap-6">
                      <p className="text-2xl leading-[130%] text-[#444444]">
                        {t(`blocks.${b.key}.body1`)}
                      </p>
                      <p className="text-2xl leading-[130%] text-[#444444]">
                        {t(`blocks.${b.key}.body2`)}
                      </p>
                    </div>
                  </div>

                  <div className="relative h-171.25 w-209.5 shrink-0 overflow-hidden rounded-3xl bg-[#f2f0eb]">
                    <Image
                      src={b.image}
                      alt=""
                      fill
                      sizes="838px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <div className="flex gap-2">
            {BLOCKS.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => emblaApi?.scrollTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all cursor-pointer",
                  i === selected ? "w-8 bg-[#191919]" : "w-1.5 bg-[#191919]/20",
                )}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous"
              className="grid h-17.5 w-17.5 place-items-center rounded-full border border-[#191919]/15 bg-white text-[#191919] transition-colors hover:bg-[#f2f0eb] cursor-pointer"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next"
              className="grid h-17.5 w-17.5 place-items-center rounded-full bg-[#191919] text-white transition-colors hover:bg-[#2a1810] cursor-pointer"
            >
              <ArrowRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
