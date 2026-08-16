import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Fills the viewport below the sticky header at every breakpoint via the
 * shared `--hero-h` token (see globals.css), which already compensates for
 * the `.fluid-viewport` zoom on md+.
 *
 * The section itself is full-bleed; the inner container keeps the 1440
 * design frame so the composition matches Figma. On mobile the video takes
 * whatever height is left over after the copy block, so the hero fills the
 * screen exactly instead of ending in dead space.
 */
export function Hero() {
  const t = useTranslations("home.hero");
  const cta = useTranslations("cta");

  return (
    <section className="flex min-h-(--hero-h) w-full flex-col md:h-(--hero-h) md:min-h-0 md:overflow-hidden md:py-6">
      <div className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-5 px-5 pb-6 pt-4 md:h-full md:flex-row md:items-center md:justify-between md:gap-[clamp(24px,4vw,76px)] md:px-9 md:pb-0 md:pt-0">
        {/* Mobile: video appears first (top of stack) and absorbs the slack */}
        <div className="relative order-first min-h-45 w-full flex-1 overflow-hidden rounded-3xl bg-paper-dark md:order-last md:h-full md:w-1/2 md:min-h-0 md:flex-none md:rounded-4xl">
          <video
            src="/sections/home/hero-video.mp4"
            poster="/sections/home/hero-video-poster.png"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        <div className="flex w-full shrink-0 flex-col gap-5 md:h-full md:min-w-0 md:flex-1 md:justify-center md:gap-[clamp(16px,3dvh,28px)]">
          <div className="flex flex-col gap-2.5 md:gap-[clamp(6px,1.4dvh,14px)]">
            <h1 className="display-1 text-ink">
              {t.rich("title", {
                a: (chunks) => <span className="text-quiet">{chunks}</span>,
              })}
            </h1>
            <p className="body-lg text-ink-3 md:max-w-121.25">
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
