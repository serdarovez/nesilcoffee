import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ru", "en", "tk", "ar"] as const,
  defaultLocale: "ru",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const localeDirection: Record<Locale, "ltr" | "rtl"> = {
  ru: "ltr",
  en: "ltr",
  tk: "ltr",
  ar: "rtl",
};

export const localeLabel: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  tk: "Türkmen",
  ar: "العربية",
};
