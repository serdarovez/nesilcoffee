import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import { ProductionProcess } from "@/components/sections/ProductionProcess";
import { Certificates } from "@/components/sections/Certificates";
import { Team } from "@/components/sections/Team";
import { CTAContact } from "@/components/sections/CTAContact";
import { AboutHistory } from "@/components/sections/AboutHistory";
import { cn } from "@/lib/utils";
import { BlurImage } from "@/components/ui/BlurImage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.hero" });
  return { title: t("title") };
}

/* -------------------------------------------------------------------------- */
/*  Welcome — Figma "main" (2048:6008). 1440 × 804.
 *  Full-width hero (1440 × 554, radius 32) on top, then a HORIZONTAL row:
 *    LEFT: 96pt ExtraBold UPPER title (853 wide) with grey/dark split
 *    RIGHT: 464-wide side column (36pt Bold sub-title + 24pt body)
 *  Row gap 123. Section VERTICAL gap 40.                                     */
/* -------------------------------------------------------------------------- */
function Welcome() {
  const t = useTranslations("about.welcome");
  return (
    <section className="mx-auto w-full max-w-378 px-5 pt-4 md:px-9 md:pt-8">
      <div className="flex flex-col gap-6 md:gap-10">
        <div className="relative h-[220px] w-full overflow-hidden rounded-2xl bg-[#0f0f0f] md:h-138.5 md:rounded-4xl">
          <video
            src="/sections/about/welcome-video.mp4"
            poster="/sections/about/welcome-hero.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-30.75">
          <h1 className="font-display font-extrabold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em] md:w-213.25 md:text-[96px] md:leading-[97%] md:tracking-[-0.035em]">
            {t.rich("title", {
              a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
            })}
          </h1>
          <div className="flex flex-col gap-4 md:w-116 md:gap-6">
            <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-xl leading-[110%] md:text-4xl md:leading-[100%]">
              {t("sideTitle")}
            </h2>
            <p className="text-sm leading-[140%] text-[#444444] md:text-2xl md:leading-[120%]">
              {t("sideBody")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Geography — Figma "Frame 122" (2048:6000). 1440 × 902.
 *  Small title at top-left (714 wide, 36pt Bold UPPER #1a1a1a, 2 lines),
 *  then a HORIZONTAL row (gap 48): image 914×798 radius 34 on left,
 *  478-wide 3-paragraph column on right (gap 24 between paragraphs).         */
/* -------------------------------------------------------------------------- */
function Geography() {
  const t = useTranslations("about.geography");
  return (
    <section className="mx-auto w-full max-w-378 px-5 pt-16 md:px-9 md:pt-32">
      <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-xl leading-[120%] tracking-[-0.02em] md:max-w-178.5 md:text-4xl md:leading-[110%]">
        {t("title")}
      </h2>
      <div className="mt-6 flex flex-col gap-6 md:mt-8 md:flex-row md:items-start md:gap-12">
        <div className="relative h-[240px] w-full shrink-0 overflow-hidden rounded-2xl bg-[#dedede] md:h-199.5 md:w-228.5 md:rounded-[34px]">
          <BlurImage
            src="/sections/about/hero-grid.jpg"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 914px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-4 md:w-119.5 md:gap-6 md:pt-4">
          <p className="text-sm leading-[140%] text-[#444444] md:text-2xl md:leading-[120%]">{t("body1")}</p>
          <p className="text-sm leading-[140%] text-[#444444] md:text-2xl md:leading-[120%]">{t("body2")}</p>
          <p className="text-sm leading-[140%] text-[#444444] md:text-2xl md:leading-[120%]">{t("body3")}</p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Quality control — Figma "контроль качества" (2048:5919). 1440 × 1436.
 *  Big split title (96pt, has <a> gray markers), then two-column layout:
 *    LEFT (102 wide, at x=48 in Figma): timeline — 2px vertical dashed line
 *          with 3 black dots + 3 stacked "Этап 01/02/03" black pills.
 *    RIGHT (1196 wide, at x=244 in Figma): 3 rows separated by 2px #d9d9d9
 *          dividers. Each row = image 296×317 + title 220 (32pt Bold UPPER)
 *          + body 586 (24pt Regular #444).                                   */
/* -------------------------------------------------------------------------- */
type QualityStep = { key: "step1" | "step2" | "step3"; image: string };
const QUALITY_STEPS: QualityStep[] = [
  { key: "step1", image: "/sections/about/history-idea.jpg" },
  { key: "step2", image: "/sections/production/alt-3.jpg" },
  { key: "step3", image: "/sections/about/history-search.jpg" },
];

function QualityControl() {
  const t = useTranslations("about.quality");
  return (
    <section className="mx-auto w-full max-w-378 px-5 pt-16 md:px-9 md:pt-32">
      <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em] md:max-w-238.25 md:text-[96px] md:leading-[97%] md:tracking-[-0.035em]">
        {t.rich("title", {
          a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
        })}
      </h2>

      {/* Mobile: linear stack of steps */}
      <div className="mt-6 flex flex-col gap-8 md:hidden">
        {QUALITY_STEPS.map((s, i) => (
          <article key={s.key} className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center rounded-full bg-[#1a1a1a] px-3 py-1.5 font-display text-xs font-bold uppercase text-white leading-[100%]">
              {t("stageLabel")} 0{i + 1}
            </div>
            <div className="relative h-[220px] w-full overflow-hidden rounded-xl bg-[#d9d9d9]">
              <Image
                src={s.image}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
            <h3 className="font-display text-xl font-bold uppercase text-black leading-[110%]">
              {t(`${s.key}.title`)}
            </h3>
            <p className="text-sm leading-[140%] text-[#444444]">
              {t(`${s.key}.body`)}
            </p>
          </article>
        ))}
      </div>

      {/* Desktop: timeline + content rows */}
      <div className="mt-12 hidden gap-6 md:flex">
        <div className="relative w-25.5 shrink-0">
          <div className="absolute left-2 top-16 bottom-16 w-0.5 bg-[#d9d9d9]" />
          <div className="flex h-full flex-col justify-between py-13">
            {QUALITY_STEPS.map((_, i) => (
              <div key={i} className="relative pl-8">
                <span className="absolute left-1 top-3.5 h-3 w-3 rounded-full bg-[#1a1a1a]" />
                <div className="inline-flex h-10 items-center rounded-full bg-[#1a1a1a] px-4 font-display text-sm font-bold uppercase text-white leading-[100%]">
                  {t("stageLabel")} 0{i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          {QUALITY_STEPS.map((s, i) => (
            <div
              key={s.key}
              className={cn(
                "border-t border-[#d9d9d9] py-10",
                i === QUALITY_STEPS.length - 1 && "border-b",
              )}
            >
              <div className="flex items-start gap-12">
                <div className="relative h-79.25 w-74 shrink-0 overflow-hidden bg-[#d9d9d9]">
                  <Image
                    src={s.image}
                    alt=""
                    fill
                    sizes="296px"
                    className="object-cover"
                  />
                </div>
                <h3 className="w-55 shrink-0 font-display text-3xl font-bold uppercase text-black leading-[100%]">
                  {t(`${s.key}.title`)}
                </h3>
                <p className="flex-1 text-2xl leading-[120%] text-[#444444]">
                  {t(`${s.key}.body`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Experts — Figma "цитата" (2048:5956). 1440 × 507.
 *  48pt Medium (Roboto Condensed) title (708 wide, dark #1a1a1a).
 *  Two cards side-by-side (708 × 371, radius 16, bg #fbfbfb, padding 30):
 *    header row: 180×180 photo + name/role stack (gap 30)
 *    quote: 24pt Regular #282828 below the header row.                       */
/* -------------------------------------------------------------------------- */
function Experts() {
  const t = useTranslations("about.experts");
  return (
    <section className="mx-auto w-full max-w-378 px-5 pt-16 md:px-9 md:pt-32">
      <h2 className="font-display text-xl font-medium leading-[120%] text-[#1a1a1a] md:max-w-177 md:text-5xl md:leading-[100%]">
        {t("title")}
      </h2>
      <div className="mt-6 flex flex-col gap-4 md:mt-10 md:flex-row md:gap-6">
        {(["one", "two"] as const).map((k) => (
          <article
            key={k}
            className="flex flex-col gap-4 rounded-2xl bg-[#fbfbfb] p-5 md:w-177 md:gap-6 md:p-7.5"
          >
            <div className="flex items-center gap-4 md:gap-7.5">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[#dedede] md:h-45 md:w-45">
                <Image
                  src="/sections/about/expert-1.png"
                  alt={t(`${k}.name`)}
                  fill
                  sizes="(max-width: 768px) 96px, 180px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-1 md:gap-2">
                <div className="font-display text-xl font-bold text-[#282828] leading-[110%] md:text-3xl md:leading-[100%]">
                  {t(`${k}.name`)}
                </div>
                <div className="text-sm text-[#909090] md:text-lg">{t(`${k}.role`)}</div>
              </div>
            </div>
            <p className="text-sm leading-[140%] text-[#282828] md:text-2xl md:leading-[120%]">
              {t(`${k}.quote`)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  History — Figma "наша история" (2048:5994). 1440 × 810.
 *  Top row: title "НАША ИСТОРИЯ" 96pt ExtraBold (gray+dark split) LEFT,
 *  subtitle 36pt Bold RIGHT ("Готовим высококачественную продукцию с 2024 года"),
 *  and two arrow nav buttons far right. Divider line below.
 *  Body: horizontal card carousel of 4 cards (Идея, Поиск, Обжарка, Реализация).
 *  Each card: 1099 wide with card-title 64pt ExtraBold UPPER at top-left,
 *  image 714×514 (radius 24) on left, body copy on right column.             */
/* -------------------------------------------------------------------------- */
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Welcome />
      <Geography />
      <ProductionProcess />
      <QualityControl />
      <Experts />
      <AboutHistory />
      <Certificates />
      <Team />
      <CTAContact />
    </>
  );
}
