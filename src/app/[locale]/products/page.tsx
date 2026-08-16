import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import { ProductionProcess } from "@/components/sections/ProductionProcess";
import { Certificates } from "@/components/sections/Certificates";
import { Team } from "@/components/sections/Team";
import { CTAContact } from "@/components/sections/CTAContact";
import { ProductsHeroCarousel } from "@/components/sections/ProductsHeroCarousel";
import { RoastIcon, AcidityIcon } from "@/components/icons/ProductSpecs";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products.hero" });
  return { title: t("title") };
}

type Product = {
  name: string;
  image: string;
  weight: string;
  arabica: string;
  robusta: string;
  roast: number;
  acidity: number;
};

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

/** Product card — 1:1 with Figma "card product" master (415:4826).
 * 460 × 721, padding 24, radius 24, bg #fbfbfb.
 * Inner column 413 wide with: header (name + weight pill) → image → composition pills →
 * description → specs row (roast + acidity) → Заказать button.
 */
function ProductCard({ p }: { p: Product }) {
  const t = useTranslations("products");
  return (
    <article className="flex w-full flex-col gap-3 rounded-2xl bg-[#fbfbfb] p-4 md:w-115 md:rounded-3xl md:p-6">
      <div className="flex flex-col gap-0">
        <div className="flex items-start justify-between gap-4 pb-3 md:gap-12">
          <h3 className="font-display text-2xl font-bold uppercase text-[#1a1a1a] leading-[100%] md:text-4xl">
            {p.name}
          </h3>
          <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 font-display text-sm font-bold text-[#444444] md:rounded-lg md:py-1 md:text-xl">
            {p.weight}
          </span>
        </div>
        <div className="relative h-56 w-full overflow-hidden rounded-lg md:h-83.75 md:rounded-xl">
          <Image
            src={p.image}
            alt={p.name}
            fill
            sizes="(max-width: 768px) 100vw, 413px"
            className="object-contain"
          />
        </div>
      </div>

      {(p.arabica !== "—" || p.robusta !== "—") && (
        <div className="flex flex-wrap gap-2 md:gap-4">
          {p.arabica !== "—" && (
            <span className="inline-flex items-center rounded-md bg-white px-2 py-1.5 text-xs font-bold text-[#444444] md:rounded-lg md:py-2 md:text-base">
              {p.arabica} — арабика
            </span>
          )}
          {p.robusta !== "—" && (
            <span className="inline-flex items-center rounded-md bg-white px-2 py-1.5 text-xs font-bold text-[#444444] md:rounded-lg md:py-2 md:text-base">
              {p.robusta} — робуста
            </span>
          )}
        </div>
      )}

      <div className="mt-1 flex flex-col gap-4 md:mt-2 md:gap-6">
        <div className="flex flex-col gap-3 md:gap-4">
          <p className="text-sm leading-[140%] text-[#444444] md:text-xl md:leading-[130%]">
            {t("cardDescription")}
          </p>
          <div className="flex items-start gap-6 md:gap-12">
            <SpecCol label={t("roast")} value={p.roast} icon={RoastIcon} tight />
            <SpecCol label={t("acidity")} value={p.acidity} icon={AcidityIcon} />
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-lg bg-white py-3.5 text-base font-medium text-[#444444] transition-colors hover:bg-[#191919] hover:text-white md:py-4 md:text-lg"
        >
          {t("order")}
        </button>
      </div>
    </article>
  );
}

function SpecCol({
  label,
  value,
  icon: Icon,
  tight = false,
}: {
  label: string;
  value: number;
  icon: (props: { className?: string }) => React.ReactElement;
  tight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm font-normal text-[#464646] leading-[110%] md:text-lg">{label}</div>
      <div className={cn("flex items-center", tight ? "gap-0" : "gap-0.5")}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon
            key={n}
            className={cn("h-4 w-4", n <= value ? "text-[#444444]" : "text-[#c9c9c9]")}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryGrid({
  titleKey,
  products,
}: {
  titleKey: "bean" | "instant" | "freezeDried" | "tea";
  products: Product[];
}) {
  const t = useTranslations("products.categories");
  return (
    <section className="mx-auto w-full max-w-378 px-5 pt-12 md:px-9 md:pt-20">
      <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em] md:text-[96px] md:leading-[97%] md:tracking-[-0.035em]">
        {t(titleKey)}
      </h2>
      <div className="mt-6 flex flex-col gap-4 md:mt-12 md:flex-row md:flex-wrap md:gap-7.5">
        {products.map((p) => (
          <ProductCard key={p.name} p={p} />
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
