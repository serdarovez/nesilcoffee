import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Hero() {
  const t = useTranslations("home.hero");
  const cta = useTranslations("cta");

  return (
    <section className="w-full">
      <div className="mx-auto flex w-full max-w-360 items-center justify-between gap-19 px-9 pt-6">
        <div className="flex w-159.75 flex-col gap-7">
          <div className="flex flex-col gap-3.5">
            <h1 className="font-display font-bold uppercase text-[#1a1a1a] text-[116px] leading-[97%] tracking-[-0.035em]">
              {t.rich("title", {
                a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
              })}
            </h1>
            <p className="text-[22px] leading-[110%] text-[#848484] font-normal max-w-121.25">
              {t("subtitle")}
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex w-fit items-center justify-center rounded-lg bg-[#191919] px-8 py-4 text-lg font-medium text-white leading-[110%] transition-colors hover:bg-[#2a1810]"
          >
            {cta("viewProducts")}
          </Link>
        </div>

        <div className="relative h-208.25 w-184.5 shrink-0 overflow-hidden rounded-4xl bg-black">
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
      </div>
    </section>
  );
}
