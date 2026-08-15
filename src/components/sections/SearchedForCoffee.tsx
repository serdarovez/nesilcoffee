import { useTranslations } from "next-intl";

export function SearchedForCoffee() {
  const t = useTranslations("home.searched");
  return (
    <section className="w-full pt-32">
      <div className="mx-auto w-full max-w-378 px-9">
        <div className="flex items-start gap-6">
          <h2 className="w-177 font-display font-bold uppercase text-[#1a1a1a] text-[96px] leading-[97%] tracking-[-0.035em]">
            {t.rich("title", {
              a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
            })}
          </h2>
          <div className="flex w-153 flex-col gap-4 pt-2">
            <p className="text-[22px] font-light leading-[110%] text-[#1a1a1a]">
              {t("body1")}
            </p>
            <p className="text-[22px] font-light leading-[110%] text-[#1a1a1a]">
              {t("body2")}
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-16 h-164.5 w-full overflow-hidden bg-black">
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
