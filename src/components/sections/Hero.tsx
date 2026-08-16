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
        <div className="relative order-first h-[55dvh] w-full shrink-0 overflow-hidden rounded-3xl bg-black md:order-last md:h-full md:w-1/2 md:shrink md:rounded-4xl">
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
            <h1 className="font-display font-bold uppercase text-[#1a1a1a] text-[36px] leading-[100%] tracking-[-0.03em] md:text-[clamp(48px,10.5dvh,116px)] md:leading-[97%] md:tracking-[-0.035em]">
              {t.rich("title", {
                a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
              })}
            </h1>
            <p className="text-base leading-[130%] text-[#848484] font-normal md:max-w-121.25 md:text-[clamp(14px,2.2dvh,22px)] md:leading-[110%]">
              {t("subtitle")}
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#191919] px-8 py-3.5 text-base font-medium text-white leading-[110%] transition-colors hover:bg-[#2a1810] md:w-fit md:py-4 md:text-lg"
          >
            {cta("viewProducts")}
          </Link>
        </div>
      </div>
    </section>
  );
}
