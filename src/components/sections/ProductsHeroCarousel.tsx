"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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
      {/* Outer wrapper is full-viewport-width so backgrounds bleed edge-to-edge on
          screens wider than the 1512 design. Only content is centered to 1512. */}
      <div className="relative h-235.25 w-full overflow-hidden">
        <div className="h-224.5 overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {HERO_SLIDES.map((s) => (
              <div
                key={s.id}
                className="relative h-full w-full flex-[0_0_100%] min-w-0"
              >
                {/* Background image — full slide width, edge to edge */}
                <Image
                  src={s.bg}
                  alt=""
                  fill
                  priority={s.id === "karak"}
                  sizes="100vw"
                  className="object-cover"
                />
                {/* Tint overlay per Figma */}
                <div className={cn("absolute inset-0", s.overlay)} />

                {/* Content — text left, product image right — capped to 1512 centered */}
                <div className="relative z-10 mx-auto flex h-full w-full max-w-378 items-center justify-between px-9">
                  <div className="flex w-171.5 max-w-[55%] flex-col gap-6">
                    <h1 className="font-display font-bold uppercase text-white text-[64px] leading-[97%] tracking-[-0.035em]">
                      {t(`slides.${s.id}.title`)}
                    </h1>
                    <p className="text-2xl leading-[120%] text-white">
                      {t(`slides.${s.id}.body`)}
                    </p>
                    <button
                      type="button"
                      className="inline-flex w-fit items-center justify-center rounded-lg border border-white/40 bg-white/10 px-8 py-4 text-lg font-medium text-white backdrop-blur-md transition-colors hover:bg-white hover:text-[#1a1a1a]"
                    >
                      {t("cta")}
                    </button>
                  </div>
                  <div
                    className="pointer-events-none relative shrink-0"
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

        {/* Dot indicators, centered below the slides */}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-4">
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={cn(
                "h-4 w-4 rounded-full transition-colors cursor-pointer",
                i === selected ? "bg-[#1d120d]" : "bg-[#dedede]",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
