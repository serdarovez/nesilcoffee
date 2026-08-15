"use client";
import { useTranslations } from "next-intl";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { RoastIcon, AcidityIcon } from "@/components/icons/ProductSpecs";
import { ArrowLeft, ArrowRight } from "lucide-react";

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
    <section className="relative w-full overflow-hidden">
      <Image
        src="/sections/home/hero-coffee-beans.png"
        alt=""
        width={1512}
        height={933}
        priority
        className="pointer-events-none absolute inset-x-0 top-0 h-[933px] w-full object-cover blur-md"
        aria-hidden
      />

      {/* Section is 1512 x 951 in Figma (2048:6184) */}
      <div className="relative mx-auto h-[951px] w-full max-w-[1512px]">
        {/* Section title at absolute (36, 186) — 2-color per Figma */}
        <h2 className="absolute left-9 top-[186px] font-display font-bold uppercase text-black text-[96px] leading-[97%] tracking-[-0.035em]">
          {t.rich("sectionTitle", {
            a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
          })}
        </h2>

        {/* Carousel at absolute top=148, full width, height 803 */}
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

          {/* Arrows — fixed, positioned per Figma Frame 175 (72,402) inside 722-tall slide.
              Slide starts at y=33 within the 803 carousel, so arrows are at y=33+402=435 */}
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

function SlideCard({ slide }: { slide: Slide }) {
  const t = useTranslations("home.products");
  return (
    <div className="relative h-[803px] w-full">
      {/* Panel: 1440 × 559 at (36, 191). Beans behind are pre-blurred, so panel is
          just a translucent white overlay for the frosted look. */}
      <div
        aria-hidden
        className="absolute left-9 top-[191px] h-[559px] w-[1440px] rounded-3xl bg-white/60"
        style={{ boxShadow: "0 20px 60px -15px rgba(0,0,0,0.15)" }}
      />

      {/* Product image: 658 × 712 at (750, 38) — 750 x + 33 slide-y offset + 5 */}
      <div className="pointer-events-none absolute left-[750px] top-[38px] h-[712px] w-[658px]">
        <Image
          src={slide.image}
          alt={slide.name}
          fill
          sizes="658px"
          className="object-contain"
          priority
        />
      </div>

      {/* Text column: 513 wide at (218, 282) — 218 x + 33+249 y */}
      <div className="absolute left-[218px] top-[282px] flex w-[513px] flex-col gap-4">
        {/* Frame 101 = tag + name + description, gap 8 */}
        <div className="flex flex-col gap-2">
          {/* Frame 100 = tag + INtenso, gap 8, 443 wide */}
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center rounded-lg bg-[#fbfbfb] px-1 py-[3px] text-xs font-bold text-[#444444]">
              {t("tagline")}
            </span>
            <h3 className="font-display font-bold uppercase text-black text-[128px] leading-[96%] tracking-[-0.04em]">
              {slide.name}
            </h3>
          </div>
          {/* Description: mixed weight — Light + SemiBold run.
              Using whitespace-pre-line to honor the \n\n paragraph break from Figma. */}
          <p className="whitespace-pre-line text-2xl font-light leading-[110%] text-[#444444]">
            {t.rich("description", {
              b: (chunks) => (
                <span className="font-semibold">{chunks}</span>
              ),
            })}
          </p>
        </div>

        {/* Frame 99 specs row: 503 wide, HORIZONTAL gap 14 */}
        <div className="flex items-center gap-3.5">
          <SpecRow
            label={t("roast")}
            value={slide.roast}
            icon={RoastIcon}
          />
          <SpecRow
            label={t("acidity")}
            value={slide.acidity}
            icon={AcidityIcon}
          />
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
      <span className="text-base font-semibold text-[#444444]">{label}</span>
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
