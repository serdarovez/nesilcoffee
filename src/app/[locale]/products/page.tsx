import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ProductionProcess } from "@/components/sections/ProductionProcess";
import { Certificates } from "@/components/sections/Certificates";
import { Team } from "@/components/sections/Team";
import { CTAContact } from "@/components/sections/CTAContact";
import { ProductsHeroCarousel } from "@/components/sections/ProductsHeroCarousel";
import { ProductCard, type Product } from "@/components/sections/ProductCard";
import { getCategoriesWithProducts } from "@/server/queries";
import {
  heroSlidesView,
  teamView,
  certificatesView,
  contactInfo,
} from "@/server/views";
import { pick } from "@/lib/i18n-field";
import { parseFieldRules, applyFieldRules } from "@/lib/category-fields";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products.hero" });
  return { title: t("title") };
}

/**
 * One grid per category. Categories now come from the database, so adding a
 * fifth category in the admin adds a fifth section here — the previous version
 * had four hardcoded blocks keyed to a fixed union type.
 */
function CategoryGrid({
  label,
  products,
  fallbackDescription,
  whatsapp,
  contactEmail,
}: {
  label: string;
  products: (Product & { id: string })[];
  fallbackDescription: string;
  whatsapp: string | null;
  contactEmail: string;
}) {
  return (
    <section className="mx-auto w-full max-w-378 px-5 pt-12 md:px-9 md:pt-20">
      <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em] md:text-[clamp(48px,7vw,96px)] md:leading-[97%] md:tracking-[-0.035em]">
        {label}
      </h2>
      {/* Explicit column counts — the old `flex-wrap` + `w-full` combination
       * gave each card the full container as its flex basis, so they came
       * out far wider (and taller) than the catalog needs. */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-10 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            p={p}
            productId={p.id}
            categoryLabel={label}
            fallbackDescription={fallbackDescription}
            whatsapp={whatsapp}
            contactEmail={contactEmail}
          />
        ))}
      </div>
    </section>
  );
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "products" });
  const fallbackDescription = t("cardDescription");

  const [categories, heroSlides, team, certificates, info] = await Promise.all([
    getCategoriesWithProducts(),
    heroSlidesView(locale, fallbackDescription),
    teamView(locale),
    certificatesView(locale),
    contactInfo(locale),
  ]);

  return (
    <>
      <ProductsHeroCarousel slides={heroSlides} />

      {/* Scroll target for the hero's call-to-action. */}
      <div id="catalog" />

      {categories
        .filter((c) => c.products.length > 0)
        .map((category) => {
          // Fields the category switches off are blanked here rather than in
          // the database, so turning a rule back on restores the old values.
          const rules = parseFieldRules(category.fieldRules);
          return (
          <CategoryGrid
            key={category.id}
            label={pick(category.name, locale)}
            fallbackDescription={fallbackDescription}
            whatsapp={info.whatsapp}
            contactEmail={info.email}
            products={category.products.map((p) => {
              const spec = applyFieldRules(rules, p);
              return {
                id: p.id,
                name: pick(p.name, locale),
                image: p.image?.path ?? null,
                weight: spec.weight,
                pieces: spec.pieces,
                // The card treats "—" as "do not render this chip".
                arabica: spec.arabica ?? "—",
                robusta: spec.robusta ?? "—",
                roast: spec.roast,
                acidity: spec.acidity,
                description: p.description
                  ? pick(p.description, locale) || null
                  : null,
                blurDataUrl: p.image?.blurDataUrl ?? null,
              };
            })}
          />
          );
        })}

      <ProductionProcess />
      <Certificates items={certificates} />
      <Team members={team} />
      <CTAContact />
    </>
  );
}
