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

export type Slide = {
  id: string;
  name: string;
  image: string | null;
  pieces?: number | null;
  /** null when the category switches the spec off — the row is omitted. */
  roast: number | null;
  acidity: number | null;
  /** Per-product copy; null falls back to the shared message. */
  description: string | null;
  tagline: string | null;
  blurDataUrl?: string | null;
};

export function ProductsCarousel({ slides }: { slides: Slide[] }) {
  // Two independent Embla instances — see MobileCarousel / DesktopCarousel.
  const t = useTranslations("home.products");
  const cta = useTranslations("cta");

  // Two independent Embla instances, one per layout. A single shared ref
  // cannot drive both: attaching it to the mobile AND the desktop container
  // left it bound to whichever mounted last (the desktop one), so on a phone
  // Embla was initialised on a `display:none` element and the visible mobile
  // carousel could not be swiped. Each layout now owns its own instance.
  return (
    <section className="relative h-[100dvh] w-full overflow-hidden md:h-(--hero-h)">
      {/* Blurred coffee-beans backdrop — desktop-only. Fills the section so
       * it scales with the section height rather than staying at design px. */}
      <div className="hidden md:block">
        <BlurImage
          src="/sections/home/hero-coffee-beans.png"
          alt=""
          width={1512}
          height={933}
          preload
          className="pointer-events-none absolute inset-0 h-full w-full object-cover blur-md"
          aria-hidden
        />
      </div>

      <MobileCarousel slides={slides} t={t} cta={cta} />
      <DesktopCarousel slides={slides} t={t} />
    </section>
  );
}

function MobileCarousel({
  slides,
  t,
  cta,
}: {
  slides: Slide[];
  t: ReturnType<typeof useTranslations>;
  cta: ReturnType<typeof useTranslations>;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    // Re-measure once layout has settled. On first mount Embla can cache
    // zero slide widths here (loop mode + percentage-basis slides inside a
    // responsive wrapper), which left selection updating while the track
    // never actually moved. A reInit on the next frame fixes the geometry.
    const raf = requestAnimationFrame(() => emblaApi.reInit());
    return () => {
      cancelAnimationFrame(raf);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // A one-screen flex column: heading, then the carousel taking the leftover
  // height, then dots and CTA. `pt` clears the sticky header so the heading is
  // never hidden behind it. The slide's image flexes inside, so the whole card
  // fits the viewport instead of stacking taller than the screen.
  return (
    <div className="flex h-full flex-col pt-[calc(var(--site-header-h)+0.5rem)] pb-4 md:hidden">
      <h2 className="display-2 gutter-x shrink-0 text-ink">
        {t.rich("sectionTitle", {
          a: (chunks) => <span className="text-quiet">{chunks}</span>,
        })}
      </h2>

      <div className="mt-3 min-h-0 flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((s) => (
            <div key={s.id} className="h-full min-w-0 flex-[0_0_100%] gutter-x">
              <MobileSlide slide={s} t={t} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex shrink-0 items-center justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all cursor-pointer",
              i === selected ? "w-6 bg-paper-dark" : "w-1.5 bg-paper-dark/20",
            )}
          />
        ))}
      </div>

      <div className="mt-3 shrink-0 gutter-x">
        <Link
          href="/products"
          className="body-md inline-flex w-full items-center justify-center rounded-lg bg-paper-dark px-8 py-3.5 font-medium text-ink-inverse transition-colors hover:bg-brand-coffee"
        >
          {cta("viewProducts")}
        </Link>
      </div>
    </div>
  );
}

/* Fluid rebuild: no more 951×1512 absolute frame. Section height is pinned to
 * `100dvh - header`. Inside: a flex column with the h2 on top and the carousel
 * row filling the rest. Card bg, product image, text column and arrows all
 * scale via dvh/vw clamps so the composition fits any viewport height. */
function DesktopCarousel({
  slides,
  t,
}: {
  slides: Slide[];
  t: ReturnType<typeof useTranslations>;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selected, setSelected] = useState(0);

  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    const raf = requestAnimationFrame(() => emblaApi.reInit());
    return () => {
      cancelAnimationFrame(raf);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="container-x relative hidden h-full flex-col pt-[clamp(48px,9dvh,120px)] pb-[clamp(20px,3dvh,40px)] md:flex">
      <h2 className="display-2 text-ink">
        {t.rich("sectionTitle", {
          a: (chunks) => <span className="text-quiet">{chunks}</span>,
        })}
      </h2>

      <div className="relative mt-[clamp(-56px,-6dvh,-24px)] flex-1 min-h-0">
        <div className="h-full overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {slides.map((s) => (
              <div key={s.id} className="h-full min-w-0 flex-[0_0_100%]">
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
            "absolute left-[clamp(20px,3vw,70px)] top-1/2 z-10 grid size-[clamp(48px,6dvh,70px)] -translate-y-1/2 place-items-center rounded-full transition-colors cursor-pointer",
            selected === 0
              ? "bg-quiet text-ink hover:bg-quiet-hover"
              : "bg-paper-darker text-ink-inverse hover:bg-black",
          )}
        >
          <ArrowLeft className="size-[clamp(18px,2.4dvh,26px)]" />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next"
          className={cn(
            "absolute right-[clamp(20px,3vw,70px)] top-1/2 z-10 grid size-[clamp(48px,6dvh,70px)] -translate-y-1/2 place-items-center rounded-full transition-colors cursor-pointer",
            selected === slides.length - 1
              ? "bg-quiet text-ink hover:bg-quiet-hover"
              : "bg-paper-darker text-ink-inverse hover:bg-black",
          )}
        >
          <ArrowRight className="size-[clamp(18px,2.4dvh,26px)]" />
        </button>
      </div>
    </div>
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
    <div className="flex h-full flex-col items-center gap-3 rounded-3xl bg-paper/60 p-4 backdrop-blur">
      {/* The image flexes to fill whatever height is left after the text, and
        * `object-contain` keeps the pack shape — so the card fits the screen
        * on tall and short phones alike instead of a fixed square pushing it
        * past the fold. */}
      <div className="relative min-h-0 w-full flex-1">
        {slide.image && (
          <Image
            src={slide.image}
            alt={slide.name}
            fill
            sizes="350px"
            className="object-contain"
            {...(slide.blurDataUrl
              ? { placeholder: "blur" as const, blurDataURL: slide.blurDataUrl }
              : {})}
          />
        )}
      </div>
      <div className="flex w-full shrink-0 flex-col gap-2">
        <div className="flex flex-col gap-1">
          <span className="eyebrow inline-flex w-fit items-center rounded-md bg-paper px-1.5 py-0.5 text-ink-2">
            {slide.tagline ?? t("tagline")}
          </span>
          <h3 className="display-2 text-ink">
            {slide.name}
          </h3>
        </div>
        {/* Clamped so a long description can never push the card past one
          * screen; the full text lives on the product page. */}
        <p className="body-sm line-clamp-3 whitespace-pre-line text-ink-2">
          {slide.description ??
            t.rich("description", {
              b: (chunks) => <span className="font-semibold">{chunks}</span>,
            })}
        </p>
        <div className="flex flex-col gap-1.5">
          {slide.roast !== null && (
            <SpecRow label={t("roast")} value={slide.roast} icon={RoastIcon} />
          )}
          {slide.acidity !== null && (
            <SpecRow label={t("acidity")} value={slide.acidity} icon={AcidityIcon} />
          )}
        </div>
      </div>
    </div>
  );
}

function SlideCard({ slide }: { slide: Slide }) {
  const t = useTranslations("home.products");
  return (
    <div className="relative h-full w-full">
      {/* Card bg — occupies the lower ~80% of the slide so the product image
       * can protrude above it, mirroring the Figma composition. */}
      <div
        aria-hidden
        className="absolute  top-[20%]  w-full bottom-0 rounded-3xl bg-paper/60"
        style={{ boxShadow: "var(--shadow-card)" }}
      />

      {/* Content grid: text on the left, image on the right. Text is
       * centered inside the card region via padding-top matching the card
       * bg's top offset; image spans full slide height and aligns bottom
       * with the card bottom via `object-bottom`. */}
      <div className="relative grid h-full grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-center gap-[clamp(24px,4vw,80px)] px-[clamp(40px,7vw,160px)]">
        {/* Text col */}
        <div className="flex min-w-0 flex-col gap-[clamp(10px,1.8dvh,18px)] pt-[clamp(24px,4dvh,60px)]">
          <span className="eyebrow inline-flex w-fit items-center rounded-lg bg-paper-alt px-1 py-[3px] text-ink-2">
            {slide.tagline ?? t("tagline")}
          </span>
          <h3 className="display-1 text-ink">
            {slide.name}
          </h3>
          <p className="body-lg whitespace-pre-line text-ink-2">
            {slide.description ??
              t.rich("description", {
                b: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}
          </p>
          <div className="mt-[clamp(4px,0.8dvh,8px)] flex items-center gap-3.5">
            {slide.roast !== null && (
              <SpecRow label={t("roast")} value={slide.roast} icon={RoastIcon} />
            )}
            {slide.acidity !== null && (
              <SpecRow
                label={t("acidity")}
                value={slide.acidity}
                icon={AcidityIcon}
              />
            )}
          </div>
        </div>

        {/* Image col — extends full slide height; product visually aligned
         * with card bottom by clipping the render box just above the card
         * bottom padding. */}
        <div className="pointer-events-none relative h-full">
          {slide.image && (
            <Image
              src={slide.image}
              alt={slide.name}
              fill
              sizes="45vw"
              className="object-contain object-bottom"
              {...(slide.blurDataUrl
                ? { placeholder: "blur" as const, blurDataURL: slide.blurDataUrl }
                : {})}
            />
          )}
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
      <span className="body-sm font-semibold text-ink-2">{label}</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={cn(
              "inline-flex h-4 w-4 items-center justify-center",
              n <= value ? "text-ink-2" : "text-ink-5",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        ))}
      </div>
    </div>
  );
}
