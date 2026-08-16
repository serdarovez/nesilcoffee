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
  productWidth: number;
  productHeight: number;
};

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "karak",
    bg: "/products/hero-slide-1-bg.jpg",
    overlay: "bg-[#245314]/40",
    product: "/products/product-carousel-var-d.png",
    productWidth: 554,
    productHeight: 494,
  },
  {
    id: "espresso",
    bg: "/products/hero-slide-2-bg.jpg",
    overlay: "bg-[#1e140f]/65",
    product: "/products/grain-2.png",
    productWidth: 700,
    productHeight: 600,
  },
  {
    id: "latte",
    bg: "/products/products-hero-bg.jpg",
    overlay: "bg-[#1e140f]/65",
    product: "/products/instant-1.png",
    productWidth: 624,
    productHeight: 536,
  },
];

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
    <section className="relative w-full">
      <div className="relative h-[70dvh] min-h-[500px] w-full overflow-hidden md:h-235.25 md:min-h-0">
        <div className="h-[calc(70dvh-2.5rem)] overflow-hidden md:h-224.5" ref={emblaRef}>
          <div className="flex h-full">
            {HERO_SLIDES.map((s) => (
              <div
                key={s.id}
                className="relative h-full w-full flex-[0_0_100%] min-w-0"
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

                {/* Mobile: text stacked, no product image showing */}
                <div className="relative z-10 mx-auto flex h-full w-full max-w-378 flex-col justify-end px-5 pb-16 md:flex-row md:items-center md:justify-between md:px-9 md:pb-0">
                  <div className="flex flex-col gap-3 md:w-171.5 md:max-w-[55%] md:gap-6">
                    <h1 className="font-display font-bold uppercase text-white text-[32px] leading-[100%] tracking-[-0.03em] md:text-[64px] md:leading-[97%] md:tracking-[-0.035em]">
                      {t(`slides.${s.id}.title`)}
                    </h1>
                    <p className="text-sm leading-[130%] text-white md:text-2xl md:leading-[120%]">
                      {t(`slides.${s.id}.body`)}
                    </p>
                    <button
                      type="button"
                      className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-white/40 bg-white/10 px-8 py-3 text-base font-medium text-white backdrop-blur-md transition-colors hover:bg-white hover:text-[#1a1a1a] md:mt-0 md:w-fit md:py-4 md:text-lg"
                    >
                      {t("cta")}
                    </button>
                  </div>
                  <div
                    className="pointer-events-none relative hidden shrink-0 md:block"
                    style={{
                      width: `${s.productWidth}px`,
                      height: `${s.productHeight}px`,
                      maxWidth: "45%",
                    }}
                  >
                    <Image
                      src={s.product}
                      alt={t(`slides.${s.id}.title`)}
                      fill
                      sizes={`${s.productWidth}px`}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3 md:bottom-6 md:gap-4">
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={cn(
                "h-3 w-3 rounded-full transition-colors cursor-pointer md:h-4 md:w-4",
                i === selected ? "bg-[#1d120d]" : "bg-[#dedede]",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
