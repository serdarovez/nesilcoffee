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
  avatarBlurDataUrl: string | null;
};

/** A full desktop row holds this many cards without them looking stranded. */
const ROW_CAPACITY = 4;

export function Team({ members }: { members: TeamMemberView[] }) {
  const t = useTranslations("home.team");

  // Up to a full row, desktop shows every member at once: a carousel there is
  // friction rather than navigation — arrows that scroll nothing, dots that
  // never change, and cards sized for a peek that has nothing to peek at.
  // Mobile always scrolls, since four cards never fit a phone.
  const fitsOneRow = members.length <= ROW_CAPACITY;

  // Two independent Embla instances, as in ProductsCarousel: a single ref
  // binds to whichever element mounted last, which on a phone left the
  // instance attached to the hidden desktop track and killed swiping. The
  // desktop hook is still called unconditionally — hooks must be — but when
  // the grid renders, its ref never attaches and its api stays null.
  const [mobileRef, mobileApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    containScroll: "trimSnaps",
  });
  const [deskRef, deskApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    containScroll: "trimSnaps",
  });

  if (members.length === 0) return null;

  return (
    <section id="team" className="container-x section-pt">
      {/* Mobile — always a carousel. */}
      <div className="md:hidden">
        <TeamHeader title={t("title")} api={mobileApi} show />
        <CarouselTrack members={members} emblaRef={mobileRef} />
        <Dots api={mobileApi} />
      </div>

      {/* Desktop — one row when everyone fits, carousel when they don't. */}
      <div className="hidden md:block">
        <TeamHeader title={t("title")} api={deskApi} show={!fitsOneRow} />
        {fitsOneRow ? (
          /* Columns come from the count, not a fixed `grid-cols-4`, so three
           * members fill the row as thirds instead of leaving a gap where a
           * fourth would be. Inline because Tailwind cannot emit a class for
           * a value only known at runtime. */
          <div
            className="mt-[clamp(24px,4dvh,40px)] grid gap-[clamp(12px,1.2vw,20px)]"
            style={{
              gridTemplateColumns: `repeat(${members.length}, minmax(0, 1fr))`,
            }}
          >
            {members.map((m) => (
              <MemberCard key={m.id} m={m} sizes="25vw" />
            ))}
          </div>
        ) : (
          <>
            <CarouselTrack members={members} emblaRef={deskRef} />
            <Dots api={deskApi} />
          </>
        )}
      </div>
    </section>
  );
}

/** Section title, with the arrows only where something actually scrolls. */
function TeamHeader({
  title,
  api,
  show,
}: {
  title: string;
  api: ReturnType<typeof useEmblaCarousel>[1];
  show: boolean;
}) {
  const prev = useCallback(() => api?.scrollPrev(), [api]);
  const next = useCallback(() => api?.scrollNext(), [api]);

  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="display-2 text-ink">{title}</h2>
      {show && (
        <div className="flex shrink-0 gap-2 md:gap-[clamp(10px,1vw,16px)]">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous member"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-quiet text-ink transition-colors hover:bg-quiet-hover md:size-[clamp(40px,3.2vw,48px)]"
          >
            <ArrowLeft className="h-4 w-4 md:size-[clamp(16px,1.4vw,20px)]" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next member"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-paper-darker text-ink-inverse transition-colors hover:bg-black md:size-[clamp(40px,3.2vw,48px)]"
          >
            <ArrowRight className="h-4 w-4 md:size-[clamp(16px,1.4vw,20px)]" />
          </button>
        </div>
      )}
    </div>
  );
}

function CarouselTrack({
  members,
  emblaRef,
}: {
  members: TeamMemberView[];
  emblaRef: ReturnType<typeof useEmblaCarousel>[0];
}) {
  return (
    <div
      className="mt-6 overflow-hidden md:mt-[clamp(24px,4dvh,40px)]"
      ref={emblaRef}
    >
      <div className="flex gap-3 md:gap-[clamp(12px,1.2vw,20px)]">
        {members.map((m) => (
          <article
            key={m.id}
            className="flex min-w-0 flex-[0_0_82%] md:flex-[0_0_clamp(220px,20vw,300px)]"
          >
            <MemberCard m={m} sizes="(max-width: 768px) 82vw, 20vw" />
          </article>
        ))}
      </div>
    </div>
  );
}

/**
 * Dot progress indicator, mirroring ProductionProcess so every carousel on the
 * page gives the same feedback.
 *
 * One dot per *snap point*, not per member. Embla drops `loop` when
 * `canLoop()` fails — that needs every slide but one to still cover the
 * viewport, which a handful of ~300px cards in a ~1440px track do not — and
 * losing loop activates `containScroll`, trimming the snap list to only those
 * that actually scroll. A dot per member therefore produced dead dots whose
 * index was out of range for scrollTo(). Always ask Embla instead.
 */
function Dots({ api }: { api: ReturnType<typeof useEmblaCarousel>[1] }) {
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    // Snap count is viewport-dependent (card widths are clamped to vw), so it
    // has to be re-read on every reInit, not only on mount.
    const onReInit = () => {
      setSnaps(api.scrollSnapList());
      onSelect();
    };
    onReInit();
    api.on("select", onSelect);
    api.on("reInit", onReInit);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onReInit);
    };
  }, [api]);

  if (snaps.length <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-2 md:mt-[clamp(20px,3dvh,32px)]">
      {snaps.map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to slide ${i + 1} of ${snaps.length}`}
          aria-current={i === selected}
          onClick={() => api?.scrollTo(i)}
          className={cn(
            "h-1.5 cursor-pointer rounded-full transition-all",
            i === selected ? "w-6 bg-paper-dark" : "w-1.5 bg-paper-dark/20",
          )}
        />
      ))}
    </div>
  );
}

function MemberCard({ m, sizes }: { m: TeamMemberView; sizes: string }) {
  return (
    <div className="surface-card flex w-full min-w-0 flex-col p-3 md:p-[clamp(12px,1.1vw,16px)]">
      {/* Avatar — square, fills the card width.
       *
       * `object-top`, not the default centre: these are portraits, and a
       * portrait cropped to a square from the centre loses the top of the
       * head while keeping shoulders nobody needs to see. Anchoring to the
       * top keeps the face whole and trims from the bottom instead. */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-paper-mute md:rounded-2xl">
        {m.avatar && (
          <Image
            src={m.avatar}
            alt={m.name}
            fill
            loading="lazy"
            sizes={sizes}
            className="object-cover object-top"
            {...(m.avatarBlurDataUrl
              ? {
                  placeholder: "blur" as const,
                  blurDataURL: m.avatarBlurDataUrl,
                }
              : {})}
          />
        )}
      </div>

      {/* Identity block — name on top, role below. `flex-1` lets it absorb the
       * card's spare height, which pins the contact rows below to the bottom
       * so their hairlines line up across a row even when one name wraps to
       * two lines. Doing it here rather than with `mt-auto` on the contacts
       * keeps their own top margin, so a short card still has a gap under the
       * role instead of the rule butting straight against it. */}
      <div className="mt-3 flex flex-1 flex-col gap-1 md:mt-[clamp(10px,1.2dvh,14px)]">
        <div className="heading-2 text-ink">{m.name}</div>
        <div className="eyebrow text-ink-4">{m.role}</div>
      </div>

      {/* Contact rows — hairline separator, secondary colour. */}
      {(m.phone || m.email) && (
        <div className="body-sm mt-3 flex flex-col gap-1.5 border-t border-line-strong pt-3 uppercase text-ink-4 md:mt-[clamp(12px,1.8dvh,18px)] md:pt-3">
          {m.phone && (
            <a
              href={`tel:${m.phone}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {m.phone}
            </a>
          )}
          {m.email && (
            <a
              href={`mailto:${m.email}`}
              className="inline-flex items-center gap-1.5 normal-case transition-colors hover:text-ink"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {m.email}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
