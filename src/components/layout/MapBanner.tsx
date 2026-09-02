"use client";

import { mapDirectionsUrl, mapEmbedUrl } from "@/lib/map-link";
import { useLocalOffice } from "./useLocalOffice";

/**
 * The contacts-page map, pinned to whichever office the visitor is being shown.
 *
 * Head office is what the server renders, so the map is correct in the HTML for
 * everyone and for crawlers. A visitor whose country has its own office — and
 * whose office has a pin — gets the frame re-pointed after hydration, matching
 * the address and phones swapped in right above it by the same lookup. An
 * office without a pin deliberately changes nothing: a wrong map is worse than
 * head office's, which is at least a real NesilCoffee address.
 */
export function MapBanner({
  title,
  cta,
  headOfficeEmbed,
  headOfficeDirections,
}: {
  title: string;
  cta: string;
  /** Server-rendered default: the `cid` embed for the roastery. */
  headOfficeEmbed: string;
  headOfficeDirections: string;
}) {
  const office = useLocalOffice();
  // Both coordinates have to be real numbers before the map moves. Head office
  // is a correct answer for everyone; a half-built pin is a correct answer for
  // nobody, so anything short of a usable pair is treated as no pin at all.
  const candidate = office?.map;
  const pin =
    candidate &&
    Number.isFinite(candidate.lat) &&
    Number.isFinite(candidate.lng)
      ? candidate
      : null;

  const embed = pin ? mapEmbedUrl(pin) : headOfficeEmbed;
  const directions = pin ? mapDirectionsUrl(pin) : headOfficeDirections;

  return (
    <section className="container-x pt-8 pb-12 md:pt-10 md:pb-20">
      {/* Ratio, not a fixed 220px / 505px height. The banner keeps its
        * design proportion and derives its height from the width it is
        * actually given, so it works on any screen. */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl md:aspect-[1512/505] md:rounded-3xl">
        <iframe
          title={title}
          // Remounts when the pin changes so the frame re-navigates rather
          // than keeping the head-office view it first loaded.
          key={embed}
          src={embed}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 left-4 inline-flex h-11 items-center justify-center rounded-lg bg-[#1a1a1a] px-5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-black md:bottom-6 md:left-6 md:h-13 md:px-6 md:text-base"
        >
          {cta}
        </a>
      </div>
    </section>
  );
}
