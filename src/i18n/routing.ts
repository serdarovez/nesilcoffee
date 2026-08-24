import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ru", "en", "tk", "uz", "az"] as const,
  defaultLocale: "ru",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const localeDirection: Record<Locale, "ltr" | "rtl"> = {
  ru: "ltr",
  en: "ltr",
  tk: "ltr",
  uz: "ltr",
  az: "ltr",
};

export const localeLabel: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  tk: "Türkmen",
  uz: "O'zbek",
  az: "Azərbaycan",
};

/**
 * Which language a visitor's country gets on their first, un-prefixed visit.
 *
 * Geo beats the browser's Accept-Language here on purpose: Turkmen and Azeri
 * users overwhelmingly run Russian- or English-configured browsers, so
 * negotiating on Accept-Language alone would never serve them their own
 * language. An explicit URL prefix and a stored NEXT_LOCALE cookie both still
 * win over this — see src/proxy.ts for the full order.
 *
 * Countries not listed fall through to Accept-Language and then to `en`, which
 * is deliberately NOT `routing.defaultLocale`: `ru` stays the default because
 * it is the language the database is guaranteed to have, but an unidentified
 * visitor is far likelier to read English.
 */
export const COUNTRY_LOCALE: Record<string, Locale> = {
  TM: "tk",
  AZ: "az",
  UZ: "uz",
  // Russian-speaking CIS. The site's Russian copy is its most complete, so
  // sending these visitors to English would waste it.
  RU: "ru",
  BY: "ru",
  KZ: "ru",
  KG: "ru",
  TJ: "ru",
};

/** Language for a visitor whose country tells us nothing useful. */
export const FALLBACK_LOCALE: Locale = "en";

/** Resolve an ISO-3166 alpha-2 country code to a site locale. */
export function localeForCountry(country: string | null): Locale | null {
  if (!country) return null;
  return COUNTRY_LOCALE[country.toUpperCase()] ?? null;
}
