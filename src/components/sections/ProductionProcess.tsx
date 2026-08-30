"use client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BlurImage } from "@/components/ui/BlurImage";
import { cn } from "@/lib/utils";

const BLOCKS = [
  { key: "capacity", image: "/sections/production/stage-1.jpg" },
  { key: "organic", image: "/sections/production/stage-2.jpg" },
  { key: "italian", image: "/sections/home/DSC00140.webp" },
  { key: "certified", image: "/sections/production/stage-4.jpg" },
] as const;

/**
 * Scroll-driven pinned experience. The layout of a single stage is the
 * same as the previous carousel (image on top, magazine-style title / body
 * row below), but stage changes are driven by scroll position rather than
 * arrow clicks.
 *
 * Mechanism:
 *   - Outer runway is `BLOCKS.length * 100svh` tall (four viewport
 *     heights of scroll for four stages).
 *   - Invisible markers sit at 0, 100, 200, 300 svh inside the runway.
 *     An IntersectionObserver with a "middle stripe" rootMargin fires as
 *     each marker crosses viewport center, updating `active`.
 *   - A `sticky top-0` viewport-sized container pins for the runway
 *     duration and cross-fades between the four absolutely-layered stage
 *     cards on active change.
 */
export function ProductionProcess() {
  const t = useTranslations("home.production");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const markers = document.querySelectorAll<HTMLElement>(
      "[data-production-marker]",
    );
    if (markers.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(
              entry.target.getAttribute("data-production-marker"),
            );
            setActive(idx);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );

    markers.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="production" className="relative w-full">
      {/* Mobile: a plain vertical list, no pinning.
       *
       * The runway below holds the page still for four full screens while the
       * stages cross-fade. With a mouse that reads as a deliberate effect; under
       * a thumb it reads as the page having stopped responding — you swipe and
       * nothing moves. QualityTimeline already opts out of pinning on phones for
       * the same reason, so this section now matches it. */}
      <div className="container-x section-pt md:hidden">
        <h2 className="display-2 text-ink">
          {t.rich("sectionTitle", {
            a: (chunks) => <span className="text-quiet">{chunks}</span>,
          })}
        </h2>
        <div className="mt-6 flex flex-col gap-10">
          {BLOCKS.map((b) => (
            <article key={b.key} className="flex flex-col gap-4">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-paper-warm">
                <BlurImage
                  src={b.image}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              <h3 className="display-3 text-ink">
                {t(`blocks.${b.key}.title`)}
              </h3>
              <p className="body-md text-ink-2">{t(`blocks.${b.key}.body1`)}</p>
              <p className="body-md text-ink-2">{t(`blocks.${b.key}.body2`)}</p>
            </article>
          ))}
        </div>
      </div>

      {/* Desktop: scroll runway — one viewport of scroll per stage. */}
      <div
        className="relative hidden md:block"
        style={{ height: `${BLOCKS.length * 100}svh` }}
      >
        {/* Invisible scroll markers, one per stage. */}
        {BLOCKS.map((_, i) => (
          <div
            key={i}
            data-production-marker={i}
            className="pointer-events-none absolute inset-x-0 h-svh"
            style={{ top: `${i * 100}svh` }}
            aria-hidden
          />
        ))}

        {/* Sticky viewport — pinned just BELOW the sticky header for the
         * runway duration, so the section title clears the header bar instead
         * of sitting behind its translucent overlay. Height is the space left
         * under the header (`--hero-h`), and the offset is the header's own
         * height, so the pinned stage fills exactly the visible viewport. */}
        <div className="sticky top-(--site-header-h) h-(--hero-h) w-full overflow-hidden">
          {/* Small top padding only: the sticky wrapper already offsets by the
           * header height, so this is just breathing room. It used to be
           * ~100-160px to clear a `top:0` pin — that now doubled up as a visible
           * gap and shrank the image. */}
          <div className="container-x flex h-full flex-col pt-[clamp(10px,2svh,20px)] pb-6 md:pt-[clamp(10px,1.6svh,22px)] md:pb-[clamp(16px,3svh,32px)]">
            {/* Header — title + dot progress indicator */}
            <div className="flex items-start justify-between gap-4">
              <h2 className="display-2 text-ink md:max-w-[62vw]">
                {t.rich("sectionTitle", {
                  a: (chunks) => (
                    <span className="text-quiet">{chunks}</span>
                  ),
                })}
              </h2>
              <div className="flex shrink-0 items-center gap-2 pt-2 md:pt-[clamp(20px,3svh,32px)]">
                {BLOCKS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500 ease-out",
                      i === active
                        ? "w-8 bg-paper-dark"
                        : "w-1.5 bg-paper-dark/20",
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Stage stack — all layered, cross-fade on scroll-driven
             * active change. */}
            <div className="relative mt-4 flex-1 min-h-0 md:mt-[clamp(16px,2.5svh,28px)]">
              {BLOCKS.map((b, i) => (
                <div
                  key={b.key}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-700 ease-out",
                    i === active
                      ? "opacity-100"
                      : "pointer-events-none opacity-0",
                  )}
                  aria-hidden={i !== active}
                >
                  <StageCard
                    title={t(`blocks.${b.key}.title`)}
                    body1={t(`blocks.${b.key}.body1`)}
                    body2={t(`blocks.${b.key}.body2`)}
                    image={b.image}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StageCard({
  title,
  body1,
  body2,
  image,
}: {
  title: string;
  body1: string;
  body2: string;
  image: string;
}) {
  return (
    <div className="flex h-full flex-col gap-4 md:flex-row md:items-stretch md:gap-[clamp(24px,3vw,60px)]">
      {/* Text column — vertically centered next to the image. */}
      <div className="flex flex-col gap-3 md:w-[38%] md:shrink-0 md:justify-center md:gap-[clamp(14px,2svh,20px)]">
        <h3 className="display-3 text-ink">{title}</h3>
        <p className="body-md text-ink-2">{body1}</p>
        <p className="body-md text-ink-2">{body2}</p>
      </div>

      {/* Image column — dominant right side, fills the sticky viewport
       * height so the composition feels editorial rather than card-y.
       *
       * `flex-1` on mobile too, rather than a baked 4/3 box: the card is
       * pinned to a full screen, so a fixed ratio left whatever height the
       * copy did not use as dead space under the photo — a big empty gap
       * before the next section. Letting the image absorb the slack removes
       * the gap and makes the photo as large as the screen allows. */}
      <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-2xl bg-paper-warm md:h-full md:rounded-3xl">
        <BlurImage
          src={image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 62vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
