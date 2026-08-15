import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, localeDirection, type Locale } from "@/i18n/routing";
import { interTight, robotoCondensed } from "@/lib/fonts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NesilCoffee",
    url: base,
    logo: `${base}/icon.png`,
    sameAs: [
      "https://instagram.com/nesilcoffee",
      "https://tiktok.com/@nesilcoffee",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+993-137-32969",
        contactType: "sales",
        email: "info@nesilcoffee.com",
        areaServed: "TM",
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "TM",
      addressRegion: "Ahal",
      addressLocality: "Magtymguly",
    },
  };

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${interTight.variable} ${robotoCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextIntlClientProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </body>
    </html>
  );
}
