import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCountryContacts } from "@/server/queries";
import { countryFromHeaders } from "@/server/geo";
import { pick, pickList } from "@/lib/i18n-field";
import { routing } from "@/i18n/routing";

/**
 * The address and phones for the visitor's country, or nothing.
 *
 * Why this is a route rather than part of the page: every public page is
 * statically prerendered, and the footer showing an address appears on all of
 * them. Making that address depend on the visitor would force the whole site
 * to render per request, undoing the caching the site currently relies on. So
 * the pages keep shipping head office, and this one small dynamic endpoint
 * tells the client when the visitor should be shown something else.
 *
 * It answers `{ office: null }` for the common case — a visitor with no branch
 * in their country — so the client can stop without touching the DOM.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("locale");
  const locale =
    requested && routing.locales.includes(requested as never)
      ? requested
      : routing.defaultLocale;

  const country = await countryFromHeaders(await headers());
  if (!country) return NextResponse.json({ office: null });

  const offices = await getCountryContacts();
  const match = offices.find((o) => o.country === country);
  if (!match) return NextResponse.json({ office: null });

  return NextResponse.json(
    {
      office: {
        country: match.country,
        address: pick(match.address, locale),
        phones: pickList(match.phones),
      },
    },
    {
      // Per-visitor by definition. A shared cache holding this would hand one
      // country's office to everyone behind it — the same trap proxy.ts guards
      // against for its locale redirect.
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
