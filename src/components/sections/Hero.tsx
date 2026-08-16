import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Header is `md:h-20.5` (82px design px). Section height compensates for
 * the outer `.fluid-desktop` zoom so the visual hero exactly fills the
 * space below the sticky header at every viewport.
 *   visual_hero = layout_hero * fluid_scale
 *              => layout_hero = (100dvh - 82px * fluid_scale) / fluid_scale
 *                            = 100dvh / fluid_scale - 82px
 */
const HERO_HEIGHT = "calc(100dvh / var(--fluid-scale, 1) - 82px)";

export function Hero() {
  const t = useTranslations("home.hero");
  const cta = useTranslations("cta");

  return (
    <section
      className="w-full md:h-(--hero-h) md:overflow-hidden md:py-6"
      style={{ ["--hero-h" as string]: HERO_HEIGHT }}
    >
      <div className="mx-auto flex w-full max-w-360 flex-col gap-6 px-5 pt-4 md:h-full md:flex-row md:items-center md:justify-between md:gap-[clamp(24px,4vw,76px)] md:px-9 md:pt-0">
        {/* Mobile: video appears first (top of stack) */}
        <div className="relative order-first h-[55dvh] w-full shrink-0 overflow-hidden rounded-3xl bg-paper-dark md:order-last md:h-full md:w-1/2 md:shrink md:rounded-4xl">
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

        <div className="flex w-full flex-col gap-5 md:h-full md:min-w-0 md:flex-1 md:justify-center md:gap-[clamp(16px,3dvh,28px)]">
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
