import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, localeDirection, type Locale } from "@/i18n/routing";
import { fontSans, fontDisplay } from "@/lib/fonts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { contactInfo } from "@/server/views";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: {
      default: t("defaultTitle"),
      template: `%s — ${t("siteName")}`,
    },
    description: t("defaultDescription"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}`]),
      ),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const dir = localeDirection[locale as Locale];
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nesilcoffee.com";

  // Structured data reads the same settings row as the footer and contacts
  // page, so a phone number changed in the admin updates all three at once.
  const info = await contactInfo(locale);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NesilCoffee",
    url: base,
    logo: `${base}/icon.png`,
    sameAs: [info.instagram, info.tiktok].filter(Boolean),
    contactPoint: info.phones.map((phone) => ({
      "@type": "ContactPoint",
      telephone: `+${phone.replace(/\D/g, "")}`,
      contactType: "sales",
      email: info.email,
      areaServed: "TM",
    })),
    address: {
      "@type": "PostalAddress",
      streetAddress: info.address || undefined,
      addressCountry: "TM",
      addressRegion: "Ahal",
      addressLocality: "Magtymguly",
    },
  };

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${fontSans.variable} ${fontDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextIntlClientProvider>
          <SmoothScroll />
          <Header />
          {/* `pt-(--site-header-h)` replaces the space the header used to
            * occupy in the flow. It is `fixed` now rather than `sticky`,
            * because Chrome on iOS resizes the layout viewport as its address
            * bar collapses and a sticky bar went with it — see the comment in
            * Header.tsx. The padding is exactly the header's own height, so
            * `--hero-h` (100svh minus that height) still lands the first
            * screen precisely at the fold. */}
          <main className="fluid-viewport flex-1 pt-(--site-header-h)">
            {children}
          </main>
          <Footer locale={locale} />
        </NextIntlClientProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </body>
    </html>
  );
}
