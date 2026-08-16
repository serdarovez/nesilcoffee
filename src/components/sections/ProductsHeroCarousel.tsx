"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BlurImage } from "@/components/ui/BlurImage";

type HeroSlide = {
  id: "karak" | "espresso" | "latte";
  bg: string;
  overlay: string; // Tailwind bg-... token for the tint
  product: string;
  /** Product art width as a share of the slide, desktop only. */
  productWidth: string;
};

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "karak",
    bg: "/products/hero-slide-1-bg.jpg",
    overlay: "bg-[#245314]/40",
    product: "/products/product-carousel-var-d.png",
    productWidth: "38%",
  },
  {
    id: "espresso",
    bg: "/products/hero-slide-2-bg.jpg",
    overlay: "bg-[#1e140f]/65",
    product: "/products/grain-2.png",
    productWidth: "46%",
  },
  {
    id: "latte",
    bg: "/products/products-hero-bg.jpg",
    overlay: "bg-[#1e140f]/65",
    product: "/products/instant-1.png",
    productWidth: "42%",
  },
];

/**
 * Full-bleed hero. The section is a direct child of `<main>` (which is
 * `.fluid-viewport` — zoomed but uncapped), so `w-full` already spans the
 * whole viewport. Height is `--hero-h`, i.e. exactly the space left under
 * the sticky header, zoom-compensated.
 *
 * Layout per breakpoint:
 *   mobile  — column: product art takes the slack up top, copy sits at the
 *             bottom, dots overlay the image.
 *   md+     — row: copy left, product art right, both vertically centered.
 */
export function ProductsHeroCarousel() {
  const t = useTranslations("products.hero");
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selected, setSelected] = useState(0);

  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  return (
    <section className="relative h-(--hero-h) w-full overflow-hidden">
      <div className="h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {HERO_SLIDES.map((s) => (
            <div
              key={s.id}
              className="relative h-full w-full min-w-0 flex-[0_0_100%]"
            >
              <BlurImage
                src={s.bg}
                alt=""
                fill
                preload={s.id === "karak"}
                sizes="100vw"
                className="object-cover"
              />
              <div className={cn("absolute inset-0", s.overlay)} />

              <div className="relative z-10 mx-auto flex h-full w-full max-w-(--site-max) flex-col px-5 pb-16 pt-4 md:flex-row md:items-center md:justify-between md:gap-[clamp(24px,4vw,72px)] md:px-9 md:pb-0 md:pt-0">
                {/* Product art — first (top) on mobile, right column on md+ */}
                <div
                  className="pointer-events-none relative order-first min-h-0 w-full flex-1 md:order-last md:h-[78%] md:w-(--pw) md:flex-none"
                  style={{ ["--pw" as string]: s.productWidth }}
                >
                  <Image
                    src={s.product}
                    alt={t(`slides.${s.id}.title`)}
                    fill
                    sizes="(max-width: 767px) 85vw, 45vw"
                    className="object-contain object-center md:object-right"
                  />
                </div>

                {/* Copy */}
                <div className="flex shrink-0 flex-col gap-3 md:min-w-0 md:max-w-171.5 md:flex-1 md:gap-[clamp(16px,3dvh,24px)]">
                  <h1 className="font-display font-bold uppercase text-white text-[clamp(28px,8vw,36px)] leading-[100%] tracking-[-0.03em] md:text-[clamp(38px,6.6dvh,64px)] md:leading-[97%] md:tracking-[-0.035em]">
                    {t(`slides.${s.id}.title`)}
                  </h1>
                  <p className="text-sm leading-[130%] text-white md:text-[clamp(16px,2.4dvh,24px)] md:leading-[120%]">
                    {t(`slides.${s.id}.body`)}
                  </p>
                  <button
                    type="button"
                    className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-white/40 bg-white/10 px-8 py-3 text-base font-medium text-white backdrop-blur-md transition-colors hover:bg-white hover:text-ink md:mt-0 md:w-fit md:py-4 md:text-lg"
                  >
                    {t("cta")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots overlay the slide now that the hero runs edge to edge. */}
      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-3 md:bottom-[clamp(16px,3dvh,28px)] md:gap-4">
        {HERO_SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Slide ${i + 1}`}
            aria-current={i === selected}
            onClick={() => scrollTo(i)}
            className={cn(
              "h-3 w-3 cursor-pointer rounded-full border border-white/60 transition-colors md:h-4 md:w-4",
              i === selected ? "bg-white" : "bg-white/25 hover:bg-white/50",
            )}
          />
        ))}
      </div>
    </section>
  );
}
