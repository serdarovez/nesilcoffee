"use client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BlurImage } from "@/components/ui/BlurImage";
import { cn } from "@/lib/utils";

const BLOCKS = [
  { key: "capacity", image: "/sections/production/stage-1.jpg" },
  { key: "organic", image: "/sections/production/stage-2.jpg" },
  { key: "italian", image: "/sections/production/stage-3.jpg" },
  { key: "certified", image: "/sections/production/stage-4.jpg" },
] as const;

export function ProductionProcess() {
  const t = useTranslations("home.production");

  return (
    <section
      id="production"
      className="mx-auto w-full max-w-378 px-5 pt-16 md:px-9 md:pt-32"
    >
      <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em] md:max-w-219.75 md:text-[96px] md:leading-[97%] md:tracking-[-0.035em]">
        {t.rich("sectionTitle", {
          a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
        })}
      </h2>

      {/* ================= MOBILE ================= */}
      <div className="mt-8 flex flex-col gap-10 md:hidden">
        {BLOCKS.map((b) => (
          <article key={b.key} className="flex flex-col gap-4">
            <div className="relative h-[220px] w-full overflow-hidden rounded-2xl bg-[#f2f0eb]">
              <BlurImage
                src={b.image}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
            <h3 className="text-2xl font-medium leading-[110%] text-[#1a1a1a]">
              {t(`blocks.${b.key}.title`)}
            </h3>
            <div className="flex flex-col gap-4">
              <p className="text-sm leading-[140%] text-[#444444]">
                {t(`blocks.${b.key}.body1`)}
              </p>
              <p className="text-sm leading-[140%] text-[#444444]">
                {t(`blocks.${b.key}.body2`)}
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* ================= DESKTOP (pinned scroll) ================= */}
      <DesktopPin t={t} />
    </section>
  );
}

/** Desktop pinned-scroll experience — hidden below md.
 *  Text column scrolls (each stage `min-h-screen`), image column stays sticky
 *  and cross-fades between stage images via IntersectionObserver. */
function DesktopPin({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const blocks = document.querySelectorAll<HTMLElement>(
      "[data-production-stage]",
    );
    if (blocks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-production-stage"));
            setActive(idx);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );

    blocks.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mt-8 hidden md:flex items-start justify-between gap-32">
      <div className="w-125">
        {BLOCKS.map((b, i) => (
          <div
            key={b.key}
            data-production-stage={i}
            className="flex min-h-screen flex-col justify-center gap-6"
          >
            <h3 className="text-5xl font-medium leading-[100%] text-[#1a1a1a]">
              {t(`blocks.${b.key}.title`)}
            </h3>
            <p className="text-2xl leading-[130%] text-[#444444]">
              {t(`blocks.${b.key}.body1`)}
            </p>
            <p className="text-2xl leading-[130%] text-[#444444]">
              {t(`blocks.${b.key}.body2`)}
            </p>
          </div>
        ))}
        <div aria-hidden className="h-[50vh]" />
      </div>

      <div className="sticky top-24 flex h-[calc(100vh-6rem)] w-209.5 shrink-0 items-center">
        <div className="relative h-[80vh] w-full overflow-hidden rounded-3xl bg-[#f2f0eb]">
          {BLOCKS.map((b, i) => (
            <div
              key={b.key}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-out",
                i === active ? "opacity-100" : "opacity-0",
              )}
            >
              <BlurImage
                src={b.image}
                alt=""
                fill
                sizes="838px"
                className="object-cover"
              />
            </div>
          ))}

          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {BLOCKS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full bg-white transition-all duration-500 ease-out",
                  i === active ? "w-8 opacity-100" : "w-1.5 opacity-60",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
