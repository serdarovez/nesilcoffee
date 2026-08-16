"use client";
import { useTranslations } from "next-intl";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { RoastIcon, AcidityIcon } from "@/components/icons/ProductSpecs";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BlurImage } from "@/components/ui/BlurImage";
import { Link } from "@/i18n/navigation";

type Slide = {
  id: string;
  name: string;
  image: string;
  roast: number;
  acidity: number;
};

const SLIDES: Slide[] = [
  { id: "intenso", name: "INtenso", image: "/products/speciale-main.png", roast: 5, acidity: 4 },
  { id: "classico", name: "Classico", image: "/products/speciale-var-a.png", roast: 3, acidity: 3 },
  { id: "speciale", name: "Speciale", image: "/products/latte-carousel.png", roast: 4, acidity: 2 },
  { id: "la-crema", name: "La Crema", image: "/products/product-carousel-var-c.png", roast: 2, acidity: 3 },
  { id: "espresso", name: "Espresso", image: "/products/product-carousel-var-d.png", roast: 5, acidity: 5 },
];

export function ProductsCarousel() {
  const t = useTranslations("home.products");
  const cta = useTranslations("cta");

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
    <section className="relative w-full overflow-hidden pt-16 md:pt-0">
      {/* Blurred coffee-beans backdrop — desktop-only */}
      <div className="hidden md:block">
        <BlurImage
          src="/sections/home/hero-coffee-beans.png"
          alt=""
          width={1512}
          height={933}
          preload
          className="pointer-events-none absolute inset-x-0 top-0 h-[933px] w-full object-cover blur-md"
          aria-hidden
        />
      </div>

      {/* ================= MOBILE ================= */}
      <div className="md:hidden">
        <h2 className="px-5 font-display font-bold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em]">
          {t.rich("sectionTitle", {
            a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
          })}
        </h2>

        <div className="mt-6 overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {SLIDES.map((s) => (
              <div key={s.id} className="flex-[0_0_100%] min-w-0 px-5">
                <MobileSlide slide={s} t={t} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all cursor-pointer",
                i === selected ? "w-6 bg-[#191919]" : "w-1.5 bg-[#191919]/20",
              )}
            />
          ))}
        </div>

        <div className="mt-6 px-5">
          <Link
            href="/products"
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#191919] px-8 py-3.5 text-base font-medium text-white leading-[110%] transition-colors hover:bg-[#2a1810]"
          >
            {cta("viewProducts")}
          </Link>
        </div>
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="relative mx-auto hidden h-[951px] w-full max-w-[1512px] md:block">
        <h2 className="absolute left-9 top-[186px] font-display font-bold uppercase text-black text-[96px] leading-[97%] tracking-[-0.035em]">
          {t.rich("sectionTitle", {
            a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
          })}
        </h2>

        <div className="absolute inset-x-0 top-[148px] h-[803px]">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {SLIDES.map((s) => (
                <div key={s.id} className="flex-[0_0_100%] min-w-0">
                  <SlideCard slide={s} />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous"
            className={cn(
              "absolute left-[70px] top-[435px] z-10 grid h-[70px] w-[70px] place-items-center rounded-full transition-colors cursor-pointer",
              selected === 0
                ? "bg-[#d8d8d8] text-[#1a1a1a] hover:bg-[#c0c0c0]"
                : "bg-[#141414] text-white hover:bg-black",
            )}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next"
            className={cn(
              "absolute left-[1371px] top-[435px] z-10 grid h-[70px] w-[70px] place-items-center rounded-full transition-colors cursor-pointer",
              selected === SLIDES.length - 1
                ? "bg-[#d8d8d8] text-[#1a1a1a] hover:bg-[#c0c0c0]"
                : "bg-[#141414] text-white hover:bg-black",
            )}
          >
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </section>
  );
}

function MobileSlide({
  slide,
  t,
}: {
  slide: Slide;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-white/60 p-5 backdrop-blur">
      <div className="relative h-64 w-full">
        <Image
          src={slide.image}
          alt={slide.name}
          fill
          sizes="350px"
          className="object-contain"
        />
      </div>
      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="inline-flex w-fit items-center rounded-md bg-white px-1.5 py-0.5 text-[11px] font-bold text-[#444444]">
            {t("tagline")}
          </span>
          <h3 className="font-display text-4xl font-bold uppercase text-black leading-[96%] tracking-[-0.03em]">
            {slide.name}
          </h3>
        </div>
        <p className="whitespace-pre-line text-sm font-light leading-[130%] text-[#444444]">
          {t.rich("description", {
            b: (chunks) => <span className="font-semibold">{chunks}</span>,
          })}
        </p>
        <div className="flex flex-col gap-2">
          <SpecRow label={t("roast")} value={slide.roast} icon={RoastIcon} />
          <SpecRow label={t("acidity")} value={slide.acidity} icon={AcidityIcon} />
        </div>
      </div>
    </div>
  );
}

function SlideCard({ slide }: { slide: Slide }) {
  const t = useTranslations("home.products");
  return (
    <div className="relative h-[803px] w-full">
      <div
        aria-hidden
        className="absolute left-9 top-[191px] h-[559px] w-[1440px] rounded-3xl bg-white/60"
        style={{ boxShadow: "0 20px 60px -15px rgba(0,0,0,0.15)" }}
      />

      <div className="pointer-events-none absolute left-[750px] top-[38px] h-[712px] w-[658px]">
        <Image
          src={slide.image}
          alt={slide.name}
          fill
          sizes="658px"
          className="object-contain"
        />
      </div>

      <div className="absolute left-[218px] top-[282px] flex w-[513px] flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center rounded-lg bg-[#fbfbfb] px-1 py-[3px] text-xs font-bold text-[#444444]">
              {t("tagline")}
            </span>
            <h3 className="font-display font-bold uppercase text-black text-[128px] leading-[96%] tracking-[-0.04em]">
              {slide.name}
            </h3>
          </div>
          <p className="whitespace-pre-line text-2xl font-light leading-[110%] text-[#444444]">
            {t.rich("description", {
              b: (chunks) => <span className="font-semibold">{chunks}</span>,
            })}
          </p>
        </div>

        <div className="flex items-center gap-3.5">
          <SpecRow label={t("roast")} value={slide.roast} icon={RoastIcon} />
          <SpecRow label={t("acidity")} value={slide.acidity} icon={AcidityIcon} />
        </div>
      </div>
    </div>
  );
}

function SpecRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: (props: { className?: string }) => React.ReactElement;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm font-semibold text-[#444444] md:text-base">{label}</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={cn(
              "inline-flex h-4 w-4 items-center justify-center",
              n <= value ? "text-[#444444]" : "text-[#c9c9c9]",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        ))}
      </div>
    </div>
  );
}
