import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { hasLocale } from "next-intl";
import {
  routing,
  localeForCountry,
  FALLBACK_LOCALE,
  type Locale,
} from "./i18n/routing";
import { countryFromHeaders } from "./server/geo";

/**
 * Locale negotiation and prefixing for the public site.
 *
 * Renamed from `middleware.ts`: Next 16 deprecates that file convention in
 * favour of `proxy.ts`. next-intl still ships this as `createMiddleware`, which
 * is just the handler factory — the file name is what Next dispatches on. Next
 * 16 also runs proxies on the Node.js runtime by default, which is what lets
 * the geo lookup below read a database off disk.
 *
 * `admin` is excluded from the matcher. The admin dashboard is deliberately not
 * localized (it is Russian-only), so without this exclusion next-intl would
 * rewrite /admin to /ru/admin and the routes would 404.
 *
 * Note this proxy performs no authorization. Admin access is enforced in the
 * admin layout and inside every Server Action — see src/server/auth/guard.ts
 * for why matcher-based auth is not sufficient on its own.
 */

const intlMiddleware = createMiddleware(routing);

/** next-intl's own cookie name — its value is a language the visitor chose. */
const LOCALE_COOKIE = "NEXT_LOCALE";

function hasLocalePrefix(pathname: string): boolean {
  return routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

/**
 * Best supported locale from an Accept-Language header, or null.
 *
 * Resolved here rather than left to next-intl because next-intl ends at
 * `routing.defaultLocale`, which is `ru` — the language the database is
 * guaranteed to have, and the admin's primary tab, so it cannot be changed.
 * An unidentified visitor should get English instead, and owning the last two
 * steps of the chain is the only way to say so.
 */
function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q) : 1 };
    })
    .filter((entry) => entry.tag && Number.isFinite(entry.q))
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    // `ru-RU` and `ru` both match the `ru` locale; `*` means no preference.
    const primary = tag.split("-")[0];
    const match = routing.locales.find((locale) => locale === primary);
    if (match) return match;
  }
  return null;
}

/**
 * Resolution order, highest priority first:
 *
 *   1. An explicit locale in the URL. Shared links and crawlers must land where
 *      they were pointed, so this short-circuits everything below.
 *   2. The NEXT_LOCALE cookie — a language the visitor picked from the
 *      switcher. A human choice always outranks a guess about them.
 *   3. The country their IP resolves to (see COUNTRY_LOCALE in
 *      src/i18n/routing.ts). Geo outranks the browser here on purpose.
 *   4. Accept-Language.
 *   5. English.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Already addressed to a language: hand over to next-intl, which sets the
  // cookie and the alternate-link headers.
  if (hasLocalePrefix(pathname)) return intlMiddleware(request);

  const locale = await resolveLocale(request);

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  const response = NextResponse.redirect(url);
  // This redirect depends on the visitor's IP and headers, which no shared
  // cache can key on. Without this, nginx or any proxy in front could serve
  // the first visitor's country to everyone behind it.
  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function resolveLocale(request: NextRequest): Promise<Locale> {
  const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
  if (hasLocale(routing.locales, chosen)) return chosen;

  // Only reached when there is no stored choice, so the database is not
  // touched for returning visitors.
  const country = await countryFromHeaders(request.headers);
  const byCountry = localeForCountry(country);
  if (byCountry) return byCountry;

  return (
    localeFromAcceptLanguage(request.headers.get("accept-language")) ??
    FALLBACK_LOCALE
  );
}

export const config = {
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
