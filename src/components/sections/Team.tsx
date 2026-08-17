"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export type TeamMemberView = {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  avatar: string | null;
};

export function Team({ members }: { members: TeamMemberView[] }) {
  const t = useTranslations("home.team");
  const hasMembers = members.length > 0;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    // Slide widths are already viewport-fluid via CSS, so let Embla
    // treat each card as its own snap point.
    containScroll: "trimSnaps",
  });
  const [selected, setSelected] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  // Nothing to show if every member has been hidden or deleted — render
  // nothing rather than an empty carousel with dead arrows.
  if (!hasMembers) return null;

  return (
    <section id="team" className="container-x section-pt">
      {/* Header row — title + arrow navigation. */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="display-2 text-ink">{t("title")}</h2>
        <div className="flex shrink-0 gap-2 md:gap-[clamp(10px,1vw,16px)]">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous member"
            className="grid h-10 w-10 place-items-center rounded-full bg-quiet text-ink transition-colors hover:bg-quiet-hover cursor-pointer md:size-[clamp(40px,3.2vw,48px)]"
          >
            <ArrowLeft className="h-4 w-4 md:size-[clamp(16px,1.4vw,20px)]" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next member"
            className="grid h-10 w-10 place-items-center rounded-full bg-paper-darker text-ink-inverse transition-colors hover:bg-black cursor-pointer md:size-[clamp(40px,3.2vw,48px)]"
          >
            <ArrowRight className="h-4 w-4 md:size-[clamp(16px,1.4vw,20px)]" />
          </button>
        </div>
      </div>

      {/* Carousel — compact cards. Fluid widths still, just calibrated
       * for a denser 4–5 cards per view (was 3–4) so avatars don't
       * dominate the viewport height:
       *   mobile: ~1.15 cards visible (peek hints swipe)
       *   desktop: cards scale via `clamp(220px, 20vw, 300px)`, giving
       *     ~4 cards at 1200px, ~5 at 1920px. */}
      <div
        className="mt-6 overflow-hidden md:mt-[clamp(24px,4dvh,40px)]"
        ref={emblaRef}
      >
        <div className="flex gap-3 md:gap-[clamp(12px,1.2vw,20px)]">
          {members.map((m) => (
            <article
              key={m.id}
              className="surface-card flex min-w-0 flex-[0_0_82%] flex-col p-3 md:flex-[0_0_clamp(220px,20vw,300px)] md:p-[clamp(12px,1.1vw,16px)]"
            >
              {/* Avatar — square, fills card width. */}
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-paper-mute md:rounded-2xl">
                {m.avatar && (
                  <Image
                    src={m.avatar}
                    alt={m.name}
                    fill
                    sizes="(max-width: 768px) 82vw, 20vw"
                    className="object-cover"
                  />
                )}
              </div>

              {/* Identity block — name on top, role below (matches the
               * spec: heading first, then supporting label). */}
              <div className="mt-3 flex flex-col gap-1 md:mt-[clamp(10px,1.2dvh,14px)]">
                <div className="heading-2 text-ink">{m.name}</div>
                <div className="eyebrow text-ink-4">{m.role}</div>
              </div>

              {/* Contact rows — hairline separator, secondary color,
               * tighter than before to match the smaller card. */}
              {(m.phone || m.email) && (
                <div className="body-sm mt-3 flex flex-col gap-1.5 border-t border-line-strong pt-3 uppercase text-ink-4 md:mt-[clamp(12px,1.8dvh,18px)] md:pt-3">
                  {m.phone && (
                    <a
                      href={`tel:${m.phone}`}
                      className="inline-flex items-center gap-1.5 hover:text-ink transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {m.phone}
                    </a>
                  )}
                  {m.email && (
                    <a
                      href={`mailto:${m.email}`}
                      className="inline-flex items-center gap-1.5 normal-case hover:text-ink transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {m.email}
                    </a>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      {/* Dot progress indicator — mirrors ProductionProcess so all
       * carousels on the page share the same feedback pattern. */}
      <div className="mt-6 flex items-center justify-center gap-2 md:mt-[clamp(20px,3dvh,32px)]">
        {members.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to member ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all cursor-pointer",
              i === selected ? "w-6 bg-paper-dark" : "w-1.5 bg-paper-dark/20",
            )}
          />
        ))}
      </div>
    </section>
  );
}
