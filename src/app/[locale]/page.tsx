import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { ProductsCarousel } from "@/components/sections/ProductsCarousel";
import { HomeOfficeFormat } from "@/components/sections/HomeOfficeFormat";
import { SearchedForCoffee } from "@/components/sections/SearchedForCoffee";
import { ProductionProcess } from "@/components/sections/ProductionProcess";
import { Certificates } from "@/components/sections/Certificates";
import { Team } from "@/components/sections/Team";
import { CTAContact } from "@/components/sections/CTAContact";
import { homeSlidesView, teamView, certificatesView } from "@/server/views";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [slides, team, certificates] = await Promise.all([
    homeSlidesView(locale),
    teamView(locale),
    certificatesView(locale),
  ]);

  return (
    <>
      <Hero />
      <ProductsCarousel slides={slides} />
      <HomeOfficeFormat />
      <SearchedForCoffee />
      <ProductionProcess />
      <Certificates items={certificates} />
      <Team members={team} />
      <CTAContact />
    </>
  );
}
