"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

export type LocalOffice = {
  country: string;
  address: string;
  phones: string[];
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
export function useLocalOffice(): LocalOffice | null {
  const locale = useLocale();
  const [office, setOffice] = useState<LocalOffice | null>(null);

  useEffect(() => {
    const abort = new AbortController();

    void (async () => {
      try {
        const res = await fetch(`/api/contact-info?locale=${locale}`, {
          signal: abort.signal,
          // The response is per-visitor and the route says so; asking the
          // browser not to reuse it keeps a language switch honest too.
          cache: "no-store",
        });
        if (!res.ok) return;
        const data: { office: LocalOffice | null } = await res.json();
        if (data.office?.address) setOffice(data.office);
      } catch {
        // A failed lookup is not worth surfacing: the head-office details are
        // already on screen and remain correct for most of the world.
      }
    })();

    return () => abort.abort();
  }, [locale]);

  return office;
}
