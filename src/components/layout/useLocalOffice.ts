"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

export type LocalOffice = {
  country: string;
  address: string;
  phones: string[];
  /** Null when this office has no pin — the map then stays on head office. */
  map: { lat: number; lng: number } | null;
};

/**
 * The branch office for the visitor's country, once it is known.
 *
 * Returns null until the answer arrives, and null forever for the common case
 * of a visitor with no branch in their country — so a caller renders the head
 * office it was given by the server and only replaces it if there is genuinely
 * something else to show.
 *
 * This exists because the pages that display an address are statically
 * prerendered and shared by every visitor. Asking after hydration keeps them
 * that way; the alternative was rendering the entire site per request. See
 * src/app/api/contact-info/route.ts.
 */
/**
 * One request per locale, shared by every component that asks.
 *
 * The contacts page alone renders the address, the phones and the map, each of
 * which needs this answer; without the cache that is three identical uncached
 * requests on one page load. Keyed by locale because the address is localized.
 * Never cleared: the visitor's country cannot change mid-session, and a stale
 * entry would at worst be one page-load old.
 */
const inFlight = new Map<string, Promise<LocalOffice | null>>();

function loadOffice(locale: string): Promise<LocalOffice | null> {
  const cached = inFlight.get(locale);
  if (cached) return cached;

  const request = (async () => {
    try {
      const res = await fetch(`/api/contact-info?locale=${locale}`, {
        // The response is per-visitor and the route says so; asking the
        // browser not to reuse it keeps a language switch honest too.
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data: { office: LocalOffice | null } = await res.json();
      return data.office?.address ? data.office : null;
    } catch {
      // A failed lookup is not worth surfacing: the head-office details are
      // already on screen and remain correct for most of the world.
      return null;
    }
  })();

  inFlight.set(locale, request);
  return request;
}

export function useLocalOffice(): LocalOffice | null {
  const locale = useLocale();
  const [office, setOffice] = useState<LocalOffice | null>(null);

  useEffect(() => {
    let live = true;
    void loadOffice(locale).then((result) => {
      if (live && result) setOffice(result);
    });
    return () => {
      live = false;
    };
  }, [locale]);

  return office;
}
