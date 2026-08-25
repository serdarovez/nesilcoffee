import { useTranslations } from "next-intl";
import { LazyVideo } from "@/components/ui/LazyVideo";

export function SearchedForCoffee() {
  const t = useTranslations("home.searched");
  return (
    // The whole section is exactly one screen on md+: a flex column where the
    // copy takes its natural height and the video absorbs whatever is left.
    //
    // The top gap is padding, not margin, so border-box folds it *into*
    // --screen-h. As a margin it stacked on top of the 100dvh box and the
    // section overflowed the viewport by up to 96px. Padding costs the video
    // nothing horizontally — the gutters live on the inner .container-x.
    //
    // Mobile is left to flow naturally — pinning a viewport height there would
    // squeeze the video to nothing once the heading wraps onto three lines.
    <section className="w-full  overflow-hidden pt-[clamp(48px,8dvh,96px)] md:flex md:h-(--screen-h) md:flex-col">
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
      {/* Mobile height is a ratio rather than 220px; on md+ the block
        * still takes the section's leftover height via flex-1, which is
        * what keeps copy + video at exactly one screen. */}
      <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden bg-paper-dark md:mt-[clamp(20px,3dvh,40px)] md:aspect-auto md:h-auto md:min-h-0 md:flex-1">
        {/* Ping-pong loop. The file is pre-rendered as forward + reversed
         * frames, so plain `loop` turns around at the end instead of cutting
         * back to frame 0 — that cut was the visible jolt. Doing it in the
         * file rather than at runtime is not a preference: the 4K master has
         * a single keyframe (`stss: 1`), so seeking backwards per frame would
         * re-decode from frame 0 every time. Re-exporting at 1080p also took
         * the asset from 25.2 MB to 5.5 MB.
         *
         * If this clip is ever re-cut, rebuild the loop from the master with
         * (end_frame = master frame count - 1, to drop the duplicate frames
         * that would otherwise stall at each turnaround):
         *
         *   ffmpeg -i searched-video.mp4 -filter_complex \
         *     "[0:v]scale=1920:-2,split[a][b]; \
         *      [b]reverse,trim=start_frame=1:end_frame=106,setpts=PTS-STARTPTS[r]; \
         *      [a][r]concat=n=2:v=1[out]" -map "[out]" -an \
         *     -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -g 48 \
         *     -movflags +faststart searched-video-loop.mp4 */}
        <LazyVideo
          src="/sections/home/searched-video-loop.mp4"
          poster="/sections/home/searched-visual.png"
        />
      </div>
    </section>
  );
}
