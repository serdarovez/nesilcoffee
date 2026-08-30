import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LazyVideo } from "@/components/ui/LazyVideo";

/**
 * Fills the viewport below the sticky header at every breakpoint via the
 * shared `--hero-h` token (see globals.css).
 *
 * The section is full-bleed; the inner block uses the shared `.container-x`
 * so the hero copy starts on the same gutter as the header logo and every
 * section heading. It previously carried its own 1440px frame, which put it
 * 36px inside everything else at the design width and — once that frame was
 * dropped — full-bleed, which diverged again on screens wider than the cap.
 *
 * On mobile the video takes whatever height is left over after the copy
 * block, so the hero fills the screen exactly instead of ending in dead space.
 */
export function Hero() {
  const t = useTranslations("home.hero");
  const cta = useTranslations("cta");

  return (
    <section className="flex min-h-(--hero-h) w-full flex-col md:h-(--hero-h) md:min-h-0 md:overflow-hidden md:py-6">
      <div className="container-x flex flex-1 flex-col gap-5 pb-6 pt-4 md:h-full md:flex-row md:items-center md:justify-between md:gap-[clamp(24px,4vw,76px)] md:pb-0 md:pt-0">
        {/* Mobile: video appears first (top of stack) and absorbs the slack */}
        {/* Mobile floor is a share of the viewport, not a flat 180px, so
          * a short phone and a tall one both give the video a sensible
          * minimum before flex-1 hands it the leftover height. */}
        <div className="relative order-first min-h-[22svh] w-full flex-1 overflow-hidden rounded-3xl bg-paper-dark md:order-last md:h-full md:w-1/2 md:min-h-0 md:flex-none md:rounded-4xl">
          {/* `eager` — this is above the fold, so it must not wait on an
            * observer to start loading. It still pauses once scrolled past:
            * a looping video decodes frames forever otherwise, and that cost
            * followed the reader all the way down to the footer. */}
          <LazyVideo
            eager
            src="/sections/home/hero-video.mp4"
            poster="/sections/home/hero-video-poster.webp"
          />
        </div>

        <div className="flex w-full shrink-0 flex-col gap-5 md:h-full md:min-w-0 md:flex-1 md:justify-center md:gap-[clamp(16px,3svh,28px)]">
          <div className="flex flex-col gap-2.5 md:gap-[clamp(6px,1.4svh,14px)]">
            <h1 className="display-1 text-ink">
              {t.rich("title", {
                a: (chunks) => <span className="text-quiet">{chunks}</span>,
              })}
            </h1>
            {/* Measure, not the design's 485px: `ch` tracks the font size
              * so the lead keeps its line length as the type scale grows. */}
            <p className="body-lg text-ink-3 md:max-w-[46ch]">
              {t("subtitle")}
            </p>
          </div>
          <Link
            href="/products"
            className="body-md inline-flex w-full items-center justify-center rounded-lg bg-paper-dark px-8 py-3.5 font-medium text-ink-inverse transition-colors hover:bg-brand-coffee md:w-fit md:py-4"
          >
            {cta("viewProducts")}
          </Link>
        </div>
      </div>
    </section>
  );
}
