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
      {/* Scroll runway — one viewport of scroll per stage, on every device.
       *
       * Pinning does mean the page holds still under a thumb while the stages
       * cross-fade, and this was briefly stacked into a plain list on phones
       * for that reason. The scroll-driven reveal is wanted on mobile too, so
       * it stays; the `svh` units below are what actually stopped the section
       * jumping as Chrome's URL bar moves. */}
      <div
        className="relative"
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
          {/* The sticky wrapper already offsets by the header height, so this
           * is breathing room rather than clearance. On mobile it was ~10-20px,
           * which left the title crowded right up against the header bar as the
           * previous section slid away behind it; a phone needs a visible gap
           * there more than a desktop does, because the header is proportionally
           * much closer to the copy. */}
          <div className="container-x flex h-full flex-col pt-[clamp(20px,4svh,36px)] pb-6 md:pt-[clamp(10px,1.6svh,22px)] md:pb-[clamp(16px,3svh,32px)]">
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
      {/* Text column. On mobile it takes the height the photo leaves rather
       * than its own natural height: the four stages have copy of different
       * lengths, and letting each size itself moved the photo up and down as
       * the stages cross-faded — the card appeared to jump while the page was
       * pinned and still. A fixed split holds every stage on the same lines. */}
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 md:w-[38%] md:flex-none md:shrink-0 md:gap-[clamp(14px,2svh,20px)]">
        {/* `max-md:` sizes, so desktop keeps the design scale untouched. The
          * stage is a fixed screen shared between copy and photo, and the
          * longest stage's Russian text was claiming 295 of the 568 available
          * — over half the card — which left the photo small. Trimming the
          * heading and body a step on phones buys back about thirty pixels and
          * hands them to the image below. */}
        <h3 className="display-3 text-ink max-md:text-[20px]! max-md:leading-[112%]!">
          {title}
        </h3>
        <p className="body-md text-ink-2 max-md:text-[13px]! max-md:leading-[17px]!">
          {body1}
        </p>
        <p className="body-md text-ink-2 max-md:text-[13px]! max-md:leading-[17px]!">
          {body2}
        </p>
      </div>

      {/* Image column — dominant right side, fills the sticky viewport
       * height so the composition feels editorial rather than card-y.
       *
       * A fixed share of the card on mobile, not `flex-1`: sharing the slack
       * with the copy is what made the photo a different size on every stage.
       * Desktop is a row, where the width split already fixes it and the image
       * simply takes the remaining column.
       *
       * The share is set from measurement, not taste: the card is 568px on a
       * 375x812 phone and the longest stage's Russian copy needs 295 of it, so
       * anything past ~45% clipped that stage's last line. Trimming the mobile
       * type above brought the worst case down far enough for 50%, which is
       * where the photo stops looking like a thumbnail under the text. The
       * copy column is centred so the shortest stage spreads its slack evenly
       * instead of leaving one blank band above the photo. */}
      <div className="relative min-h-0 w-full flex-[0_0_50%] overflow-hidden rounded-2xl bg-paper-warm md:h-full md:flex-1 md:rounded-3xl">
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
