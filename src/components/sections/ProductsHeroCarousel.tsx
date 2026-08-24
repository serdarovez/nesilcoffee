"use client";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/** Time a slide holds before advancing. */
const AUTOPLAY_DELAY = 5500;

export type HeroSlide = {
  id: string;
  bg: string | null;
  bgBlurDataUrl: string | null;
  /** Hex, applied at `overlayOpacity`% over the background. */
  overlayColor: string;
  overlayOpacity: number;
  product: string | null;
  title: string;
  body: string;
  cta: string | null;
};

/**
 * Full-bleed hero. The section is a direct child of `<main>` (which is
 * `.fluid-viewport` — zoomed but uncapped), so `w-full` already spans the
 * whole viewport. Height is `--hero-h`, i.e. exactly the space left under
 * the sticky header.
 *
 * Layout per breakpoint:
 *   mobile  — column: product art takes the slack up top, copy sits at the
 *             bottom, dots overlay the image.
 *   md+     — row: copy left, product art right, both vertically centered.
 *
 * The tint was a static Tailwind class (`bg-[#245314]/40`); now that editors
 * choose the colour and opacity per slide it has to be an inline style, since
 * Tailwind can only emit classes it can see at build time.
 */
export function ProductsHeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const reduce = useReducedMotion() ?? false;

  // A hero that advances on its own is exactly what `prefers-reduced-motion`
  // asks us to stop, so the plugin is left out entirely rather than paused —
  // the dots still work. One slide has nowhere to go either.
  const plugins = useMemo(
    () =>
      reduce || slides.length < 2
        ? []
        : [
            Autoplay({
              delay: AUTOPLAY_DELAY,
              // Dragging or tabbing in only pauses the timer; the hero picks
              // itself back up once the visitor moves on.
              //
              // Deliberately NOT stopOnMouseEnter: the plugin binds that to the
              // carousel root, and this hero is the whole viewport — a cursor
              // resting anywhere on the page stops the timer until it leaves,
              // which reads as autoplay being broken.
              stopOnInteraction: false,
            }),
          ],
    [reduce, slides.length],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    plugins,
  );
  const [selected, setSelected] = useState(0);

  // Jumping to a slide by hand restarts the countdown, so the chosen slide
  // gets its full turn instead of the remainder of the previous one.
  const scrollTo = useCallback(
    (i: number) => {
      emblaApi?.scrollTo(i);
      emblaApi?.plugins().autoplay?.reset();
    },
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (slides.length === 0) return null;

  return (
    <section className="relative h-(--hero-h) w-full overflow-hidden">
      <div className="h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((s, i) => (
            <div
              key={s.id}
              className="relative h-full w-full min-w-0 flex-[0_0_100%]"
            >
              {/* Plain next/image rather than BlurImage: that component looks
               * its placeholder up in the generated public/ map, which has no
               * entry for an uploaded background. The blur travels with the
               * media record instead. First slide is eager — it is the LCP. */}
              {s.bg && (
                <Image
                  src={s.bg}
                  alt=""
                  fill
                  priority={i === 0}
                  loading={i === 0 ? "eager" : "lazy"}
                  sizes="100vw"
                  className="object-cover"
                  {...(s.bgBlurDataUrl
                    ? { placeholder: "blur" as const, blurDataURL: s.bgBlurDataUrl }
                    : {})}
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: s.overlayColor,
                  opacity: s.overlayOpacity / 100,
                }}
              />

              <div className="container-x relative z-10 flex h-full flex-col pb-16 pt-4 md:flex-row md:items-center md:justify-between md:gap-[clamp(24px,4vw,72px)] md:pb-0 md:pt-0">
                {/* Product art — first (top) on mobile, right column on md+.
                 * 42% was the per-slide default before the width became fixed;
                 * `object-contain` keeps any pack shape inside it. */}
                <div className="pointer-events-none relative order-first min-h-0 w-full flex-1 md:order-last md:h-[78%] md:w-[42%] md:flex-none">
                  {s.product && (
                    <Image
                      src={s.product}
                      alt={s.title}
                      fill
                      sizes="(max-width: 767px) 85vw, 45vw"
                      className="object-contain object-center md:object-right"
                    />
                  )}
                </div>

                {/* Copy */}
                <div className="flex shrink-0 flex-col gap-3 md:min-w-0 md:max-w-[52ch] md:flex-1 md:gap-[clamp(16px,3dvh,24px)]">
                  <h1 className="font-display font-bold uppercase text-white text-[clamp(28px,8vw,36px)] leading-[100%] tracking-[-0.03em] md:text-[clamp(38px,6.6dvh,64px)] md:leading-[97%] md:tracking-[-0.035em]">
                    {s.title}
                  </h1>
                  <p className="text-sm leading-[130%] text-white md:text-[clamp(16px,2.4dvh,24px)] md:leading-[120%]">
                    {s.body}
                  </p>
                  {/* Anchors to the catalog below rather than being an inert
                   * button. A plain <a href="#…"> also works without JS and is
                   * picked up by the page's smooth-scroll handler. */}
                  {s.cta && (
                    <a
                      href="#catalog"
                      className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-white/40 bg-white/10 px-8 py-3 text-base font-medium text-white backdrop-blur-md transition-colors hover:bg-white hover:text-ink md:mt-0 md:w-fit md:py-4 md:text-lg"
                    >
                      {s.cta}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots overlay the slide now that the hero runs edge to edge. */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 md:bottom-[clamp(16px,3dvh,28px)] md:gap-4">
          {slides.map((s, i) => (
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
      )}
    </section>
  );
}
