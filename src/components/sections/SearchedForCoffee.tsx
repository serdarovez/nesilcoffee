import { useTranslations } from "next-intl";

export function SearchedForCoffee() {
  const t = useTranslations("home.searched");
  return (
    <section className="w-full pt-16 md:pt-32">
      <div className="mx-auto w-full max-w-378 px-5 md:px-9">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-6">
          <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em] md:w-177 md:text-[96px] md:leading-[97%] md:tracking-[-0.035em]">
            {t.rich("title", {
              a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
            })}
          </h2>
          <div className="flex flex-col gap-3 md:w-153 md:gap-4 md:pt-2">
            <p className="text-sm font-light leading-[130%] text-[#1a1a1a] md:text-[22px] md:leading-[110%]">
              {t("body1")}
            </p>
            <p className="text-sm font-light leading-[130%] text-[#1a1a1a] md:text-[22px] md:leading-[110%]">
              {t("body2")}
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-8 h-[220px] w-full overflow-hidden bg-black md:mt-16 md:h-164.5">
        <video
          src="/sections/home/searched-video.mp4"
          poster="/sections/home/searched-visual.png"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </section>
  );
}
