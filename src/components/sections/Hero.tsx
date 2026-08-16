import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Hero() {
  const t = useTranslations("home.hero");
  const cta = useTranslations("cta");

  return (
    <section className="w-full">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-6 px-5 pt-4 md:flex-row md:items-center md:justify-between md:gap-19 md:px-9 md:pt-6">
        {/* Mobile: video appears first (top of stack) */}
        <div className="relative order-first h-[55vh] w-full shrink-0 overflow-hidden rounded-3xl bg-black md:order-last md:h-208.25 md:w-184.5 md:rounded-4xl">
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

        <div className="flex w-full flex-col gap-5 md:w-159.75 md:gap-7">
          <div className="flex flex-col gap-2.5 md:gap-3.5">
            <h1 className="font-display font-bold uppercase text-[#1a1a1a] text-[36px] leading-[100%] tracking-[-0.03em] md:text-[116px] md:leading-[97%] md:tracking-[-0.035em]">
              {t.rich("title", {
                a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
              })}
            </h1>
            <p className="text-base leading-[130%] text-[#848484] font-normal md:max-w-121.25 md:text-[22px] md:leading-[110%]">
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
