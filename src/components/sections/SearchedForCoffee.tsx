import { useTranslations } from "next-intl";

export function SearchedForCoffee() {
  const t = useTranslations("home.searched");
  return (
    <section className="w-full pt-16 md:pt-[clamp(64px,10dvh,128px)]">
      <div className="mx-auto w-full max-w-378 px-5 md:px-9">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-[clamp(16px,2vw,24px)]">
          <h2 className="display-2 text-[#1a1a1a] md:flex-[0_0_49%]">
            {t.rich("title", {
              a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
            })}
          </h2>
          <div className="flex flex-col gap-3 md:min-w-0 md:flex-1 md:gap-[clamp(12px,1.6dvh,16px)] md:pt-2">
            <p className="body-md text-[#1a1a1a]">
              {t("body1")}
            </p>
            <p className="body-md text-[#1a1a1a]">
              {t("body2")}
            </p>
          </div>
        </div>
      </div>

      {/* Full-bleed video — design height 658px on md. Fluid via clamp so
       * shorter viewports don't cost the whole above-fold row of the next
       * section, taller viewports let it breathe. */}
      <div className="relative mt-8 h-[220px] w-full overflow-hidden bg-black md:mt-[clamp(32px,6dvh,64px)] md:h-[clamp(360px,55dvh,658px)]">
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
