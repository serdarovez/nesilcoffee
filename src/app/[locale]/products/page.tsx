import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import { ProductionProcess } from "@/components/sections/ProductionProcess";
import { Certificates } from "@/components/sections/Certificates";
import { Team } from "@/components/sections/Team";
import { CTAContact } from "@/components/sections/CTAContact";
import { ProductsHeroCarousel } from "@/components/sections/ProductsHeroCarousel";
import { ProductCard, type Product } from "@/components/sections/ProductCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products.hero" });
  return { title: t("title") };
}

const BEAN: Product[] = [
  { name: "Speciale",  image: "/products/speciale-main.png",   weight: "1000 гр", arabica: "65%", robusta: "35%", roast: 3, acidity: 3 },
  { name: "Intenso",   image: "/products/speciale-var-a.png",  weight: "1000 гр", arabica: "100%", robusta: "—", roast: 5, acidity: 4 },
  { name: "Classico",  image: "/products/grain-1.png",         weight: "1000 гр", arabica: "45%", robusta: "55%", roast: 4, acidity: 3 },
  { name: "La Crema",  image: "/products/grain-2.png",         weight: "1000 гр", arabica: "80%", robusta: "20%", roast: 3, acidity: 2 },
  { name: "Espresso",  image: "/products/grain-3.png",         weight: "1000 гр", arabica: "60%", robusta: "40%", roast: 5, acidity: 3 },
];

const INSTANT: Product[] = [
  { name: "Coffee Latte",  image: "/products/instant-1.png", weight: "20 × 18 гр", arabica: "100%", robusta: "—", roast: 3, acidity: 2 },
  { name: "Cappuccino",    image: "/products/instant-2.png", weight: "20 × 18 гр", arabica: "100%", robusta: "—", roast: 3, acidity: 2 },
  { name: "Caramel Latte", image: "/products/instant-3.png", weight: "20 × 18 гр", arabica: "100%", robusta: "—", roast: 2, acidity: 2 },
  { name: "Hazelnut",      image: "/products/instant-4.png", weight: "20 × 18 гр", arabica: "100%", robusta: "—", roast: 3, acidity: 2 },
  { name: "Vanilla",       image: "/products/instant-5.png", weight: "20 × 18 гр", arabica: "100%", robusta: "—", roast: 2, acidity: 2 },
];

const FREEZE_DRIED: Product[] = [
  { name: "Gold",    image: "/products/grain-4.png",                 weight: "95 гр", arabica: "100%", robusta: "—", roast: 4, acidity: 3 },
  { name: "Platinum",image: "/products/grain-5.png",                 weight: "95 гр", arabica: "100%", robusta: "—", roast: 5, acidity: 3 },
  { name: "Black",   image: "/products/latte-carousel.png",          weight: "95 гр", arabica: "100%", robusta: "—", roast: 5, acidity: 4 },
  { name: "Aroma",   image: "/products/product-carousel-var-c.png",  weight: "95 гр", arabica: "100%", robusta: "—", roast: 4, acidity: 3 },
  { name: "Classic", image: "/products/product-carousel-var-d.png",  weight: "95 гр", arabica: "100%", robusta: "—", roast: 4, acidity: 3 },
];

const TEA: Product[] = [
  { name: "Karak", image: "/products/tea-1.png", weight: "200 гр", arabica: "—", robusta: "—", roast: 3, acidity: 2 },
];

function CategoryGrid({
  titleKey,
  products,
}: {
  titleKey: "bean" | "instant" | "freezeDried" | "tea";
  products: Product[];
}) {
  const t = useTranslations("products.categories");
  const categoryLabel = t(titleKey);
  return (
    <section className="mx-auto w-full max-w-378 px-5 pt-12 md:px-9 md:pt-20">
      <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em] md:text-[96px] md:leading-[97%] md:tracking-[-0.035em]">
        {categoryLabel}
      </h2>
      <div className="mt-6 flex flex-col gap-4 md:mt-12 md:flex-row md:flex-wrap md:gap-7.5">
        {products.map((p) => (
          <ProductCard key={p.name} p={p} categoryLabel={categoryLabel} />
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

  return (
    <>
      <ProductsHeroCarousel />
      <CategoryGrid titleKey="bean" products={BEAN} />
      <CategoryGrid titleKey="instant" products={INSTANT} />
      <CategoryGrid titleKey="freezeDried" products={FREEZE_DRIED} />
      <CategoryGrid titleKey="tea" products={TEA} />
      <ProductionProcess />
      <Certificates />
      <Team />
      <CTAContact />
    </>
  );
}
