import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import { ProductionProcess } from "@/components/sections/ProductionProcess";
import { Certificates } from "@/components/sections/Certificates";
import { Team } from "@/components/sections/Team";
import { CTAContact } from "@/components/sections/CTAContact";
import { AboutHistory } from "@/components/sections/AboutHistory";
import { QualityTimeline } from "@/components/sections/QualityTimeline";
import { teamView, certificatesView, expertsView, type ExpertView } from "@/server/views";
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
/*  Welcome — Figma "main" (2048:6008).
 *  NOT a full-bleed hero: the design is a contained 40px-gap stack of a
 *  rounded video plate (2048:6009 — 1440×554, r32, video fill under a flat
 *  60% black scrim) with the intro copy BELOW it on the page white, in dark
 *  ink. On md+ the whole stack is height-anchored to `--hero-h` so plate and
 *  copy share exactly one screen under the sticky header — the Figma 554px
 *  plate height is what that resolves to at the design viewport anyway.
 *  The copy row (2048:6010) keeps the Figma ratios — 853/1440 = 59.24%
 *  title, 123/1440 = 8.54% gutter, 464/1440 = 32.22% side column — rather
 *  than baked px, so it reflows at any width.                               */
/* -------------------------------------------------------------------------- */
function Welcome() {
  const t = useTranslations("about.welcome");
  return (
    <section className="container-x flex flex-col pt-6 md:min-h-(--hero-h) md:pb-[clamp(16px,3svh,40px)] md:pt-8">
      {/* Desktop: the plate drops its baked 1440/554 ratio and absorbs the
       * slack left over by the copy row, so plate + copy land inside one
       * `--hero-h` screen. The min-height keeps it from collapsing on short
       * viewports — there the section grows past the fold rather than
       * squeezing the video to nothing. */}
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-brand-espresso md:aspect-auto md:min-h-[38svh] md:flex-1 md:rounded-4xl">
        {/* Two sources: the browser plays the first that loads. When a
          * pre-rendered forward+reverse file is present it boomerangs
          * seamlessly on a plain `loop`; until then it falls back to the
          * original clip (a plain loop with one soft cut). Both play smoothly
          * — no JS reverse-seek, which stuttered on this clip's sparse
          * keyframes. Generate the loop file with the ffmpeg command in the
          * deploy notes / SearchedForCoffee.tsx. */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/sections/about/welcome-hero.jpg"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/sections/about/welcome-video-loop.mp4" type="video/mp4" />
          <source src="/sections/about/welcome-video.mp4" type="video/mp4" />
        </video>
        {/* Flat scrim, matching the solid black @ 60% that Figma stacks on
         * top of the video fill — no gradient, the copy is off-image. */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="mt-8 flex flex-col gap-5 md:mt-[clamp(20px,3.6svh,40px)] md:shrink-0 md:flex-row md:items-start md:gap-[8.54%]">
        <h1 className="display-2 font-extrabold text-ink md:w-[59.24%] md:min-w-0">
          {t.rich("title", {
            a: (chunks) => <span className="text-quiet">{chunks}</span>,
          })}
        </h1>
        <div className="flex flex-col gap-3 md:w-[32.22%] md:min-w-0 md:gap-6">
          <h2 className="display-4 text-ink">{t("sideTitle")}</h2>
          <p className="body-xl text-ink-2">{t("sideBody")}</p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Geography — Figma "Frame 122" (2048:6000).
 *  Heading (714/1440 = 49.6%), then image 914×798 (63.5% wide, 1.145:1)
 *  beside a 478-wide (33.2%) three-paragraph column. On md+ the section is
 *  height-anchored to one `--screen-h`: the widths stay on the Figma ratios,
 *  but the plate takes its height from the screen rather than the ratio, so
 *  the copy column can never be pushed past the fold.                       */
/* -------------------------------------------------------------------------- */
function Geography() {
  const t = useTranslations("about.geography");
  return (
    <section className="container-x section-pt flex flex-col md:min-h-(--screen-h) md:pb-[clamp(24px,5svh,64px)]">
      <h2 className="display-4 text-ink md:max-w-[49.6%] md:shrink-0">
        {t("title")}
      </h2>
      {/* The row owns the leftover screen and the plate stretches into it
       * (items-stretch), so heading + image + copy share one `--screen-h`
       * instead of the baked 914/798 plate pushing the copy off-screen. */}
      <div className="mt-6 flex flex-col gap-6 md:mt-8 md:min-h-0 md:flex-1 md:flex-row md:items-stretch md:gap-[3.3%]">
        <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-2xl bg-paper-mute md:aspect-auto md:min-h-[38svh] md:w-[63.5%] md:rounded-[clamp(20px,2.2vw,34px)]">
          <BlurImage
            src="/sections/about/hero-grid.jpg"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 64vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-4 md:w-[33.2%] md:min-w-0 md:gap-[clamp(12px,2svh,24px)] md:pt-2">
          <p className="body-xl text-ink-2">{t("body1")}</p>
          <p className="body-xl text-ink-2">{t("body2")}</p>
          <p className="body-xl text-ink-2">{t("body3")}</p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Quality control — Figma "контроль качества" (2048:5919).
 *  Split 96pt title, then a timeline rail (102/1440 = 7.1%) beside three
 *  divider-separated rows. Each row: image 296×317 (24.7% of the row,
 *  0.934:1), a 220-wide (18.4%) title, and a flexible body column.         */
/* -------------------------------------------------------------------------- */
type QualityStep = { key: "step1" | "step2" | "step3"; image: string };
const QUALITY_STEPS: QualityStep[] = [
  { key: "step1", image: "/sections/about/history-idea.jpg" },
  { key: "step2", image: "/sections/production/alt-3.jpg" },
  { key: "step3", image: "/sections/about/history-search.jpg" },
];

function QualityControl() {
  const t = useTranslations("about.quality");
  // Copy is resolved here so the animated timeline receives plain strings and
  // the messages never have to cross into the client bundle.
  const steps = QUALITY_STEPS.map((s, i) => ({
    key: s.key,
    image: s.image,
    title: t(`${s.key}.title`),
    body: t(`${s.key}.body`),
    stage: `${t("stageLabel")} 0${i + 1}`,
  }));

  return (
    <section className="container-x section-pt">
      {/* The heading is rendered inside the timeline: on desktop it has to sit
       * within the pinned viewport so it stays on screen across all steps. */}
      <QualityTimeline
        title={t.rich("title", {
          a: (chunks) => <span className="text-quiet">{chunks}</span>,
        })}
        steps={steps}
      />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Experts — Figma "цитата" (2048:5956).
 *  48pt title (708/1440 = 49.2%) over two equal cards. Photo is 180/708 =
 *  25.4% of its card, square, so it tracks the card instead of a fixed px.  */
/* -------------------------------------------------------------------------- */
function Experts({
  title,
  items,
}: {
  title: string;
  items: ExpertView[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="container-x section-pt">
      <h2 className="display-3 text-ink md:max-w-[49.2%]">{title}</h2>
      <div className="mt-6 flex flex-col gap-4 md:mt-[clamp(24px,5svh,40px)] md:flex-row md:gap-[clamp(16px,2vw,24px)]">
        {items.map((expert) => (
          <article
            key={expert.id}
            className="surface-card flex flex-col gap-4 p-5 md:min-w-0 md:flex-1 md:gap-[clamp(16px,2.6svh,24px)] md:p-[clamp(18px,2vw,30px)]"
          >
            <div className="flex items-center gap-4 md:gap-[clamp(16px,2.2vw,30px)]">
              {/* The photo slot keeps its box when empty rather than letting
               * the name jump left: the two cards sit side by side and must
               * stay aligned even if only one has a portrait. */}
              <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-lg bg-paper-mute md:w-[25.4%]">
                {expert.photo && (
                  <Image
                    src={expert.photo}
                    alt={expert.name}
                    fill
                    sizes="(max-width: 768px) 96px, 13vw"
                    /* `object-top`, not the default centre. These are 2:3
                     * portraits in a square slot, so a centred crop discards a
                     * third of the height split evenly top and bottom — which
                     * sliced the top off both experts' heads while keeping desk
                     * and torso. Anchoring to the top keeps the face whole with
                     * natural headroom and trims from the bottom instead. Same
                     * reasoning as the team avatars. */
                    className="object-cover object-top"
                    {...(expert.blurDataUrl
                      ? {
                          placeholder: "blur" as const,
                          blurDataURL: expert.blurDataUrl,
                        }
                      : {})}
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-1 md:gap-2">
                <div className="heading-1 text-paper-charcoal">
                  {expert.name}
                </div>
                <div className="text-sm text-ink-3 md:text-[clamp(14px,1.2vw,18px)]">
                  {expert.role}
                </div>
              </div>
            </div>
            {/* Rich text. Safe by construction — the admin form is the only
             * writer and runs every value through the tag allowlist. */}
            <div
              className="rich-text body-xl text-paper-charcoal"
              dangerouslySetInnerHTML={{ __html: expert.quote }}
            />
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tExperts = await getTranslations({ locale, namespace: "about.experts" });

  const [team, certificates, experts] = await Promise.all([
    teamView(locale),
    certificatesView(locale),
    expertsView(locale, tExperts("title")),
  ]);

  return (
    <>
      {/* Order is the Figma child order of "О нас" (2048:5860) read top-down:
       * main → Frame 122 → наша история → carousel → контроль качества →
       * цитата → сертификаты → team → вопросы. The history carousel belongs
       * directly after Geography, ahead of the production process. */}
      <Welcome />
      <Geography />
      <AboutHistory />
      <ProductionProcess />
      <QualityControl />
      <Experts title={experts.title} items={experts.items} />
      <Certificates items={certificates} />
      <Team members={team} />
      <CTAContact />
    </>
  );
}
