import { useTranslations } from "next-intl";

export function SearchedForCoffee() {
  const t = useTranslations("home.searched");
  return (
    // The whole section is exactly one screen on md+: a flex column where the
    // copy takes its natural height and the video absorbs whatever is left.
    // Margin, not padding, so the video still runs edge to edge.
    //
    // Mobile is left to flow naturally — pinning a viewport height there would
    // squeeze the video to nothing once the heading wraps onto three lines.
    <section className="w-full mt-[clamp(48px,8dvh,96px)] md:flex md:h-(--screen-h) md:flex-col">
      <div className="container-x md:shrink-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-[clamp(16px,2vw,24px)]">
          <h2 className="display-2 text-ink md:flex-[0_0_49%]">
            {t.rich("title", {
              a: (chunks) => <span className="text-quiet">{chunks}</span>,
            })}
          </h2>
          <div className="flex flex-col gap-3 md:min-w-0 md:flex-1 md:gap-[clamp(12px,1.6dvh,16px)] md:pt-2">
            <p className="body-md text-ink">
              {t("body1")}
            </p>
            <p className="body-md text-ink">
              {t("body2")}
            </p>
          </div>
        </div>
      </div>

      {/* Full-bleed. `flex-1` + `min-h-0` makes it claim the rest of the
       * section's screen height rather than carrying a height of its own —
       * that is what keeps copy + video at exactly one screen instead of the
       * two competing fixed heights this had before. */}
      <div className="relative mt-6 h-[220px] w-full overflow-hidden bg-paper-dark md:mt-[clamp(20px,3dvh,40px)] md:h-auto md:min-h-0 md:flex-1">
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
