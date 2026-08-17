"use client";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { RoastIcon, AcidityIcon } from "@/components/icons/ProductSpecs";
import { OrderModal, type OrderProduct } from "@/components/sections/OrderModal";
import { cn } from "@/lib/utils";

export type Product = {
  name: string;
  image: string;
  weight: string;
  arabica: string;
  robusta: string;
  roast: number;
  acidity: number;
  /** Per-product copy; null means use the shared message. */
  description?: string | null;
};

export function ProductCard({
  p,
  categoryLabel,
  fallbackDescription,
  productId,
}: {
  p: Product;
  categoryLabel: string;
  /** Shared `products.cardDescription` message, resolved on the server. */
  fallbackDescription: string;
  productId?: string;
}) {
  const t = useTranslations("products");
  const [open, setOpen] = useState(false);

  const description = p.description ?? fallbackDescription;

  const orderProduct: OrderProduct = {
    id: productId,
    name: p.name,
    image: p.image,
    category: categoryLabel,
    weight: p.weight,
    description,
  };

  return (
    <>
      <article className="flex h-full w-full flex-col gap-3 rounded-2xl bg-[#fbfbfb] p-4 md:rounded-3xl md:p-5">
        <div className="flex flex-col gap-0">
          <div className="flex items-start justify-between gap-3 pb-3">
            <h3 className="font-display text-xl font-bold uppercase text-[#1a1a1a] leading-[100%] md:text-2xl">
              {p.name}
            </h3>
            <span className="inline-flex shrink-0 items-center rounded-md bg-white px-2 py-0.5 font-display text-xs font-bold text-[#444444] md:rounded-lg md:py-1 md:text-sm">
              {p.weight}
            </span>
          </div>
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg md:rounded-xl">
            <Image
              src={p.image}
              alt={p.name}
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, (max-width: 1280px) 30vw, 23vw"
              className="object-contain"
            />
          </div>
        </div>

        {(p.arabica !== "—" || p.robusta !== "—") && (
          <div className="flex flex-wrap gap-2">
            {p.arabica !== "—" && (
              <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-bold text-[#444444] md:rounded-lg">
                {p.arabica} — арабика
              </span>
            )}
            {p.robusta !== "—" && (
              <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-bold text-[#444444] md:rounded-lg">
                {p.robusta} — робуста
              </span>
            )}
          </div>
        )}

        {/* mt-auto pins the button row to the card bottom so cards in a row
         * stay aligned even when descriptions wrap to different heights. */}
        <div className="mt-auto flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-[140%] text-[#444444]">
              {description}
            </p>
            <div className="flex items-start gap-6">
              <SpecCol label={t("roast")} value={p.roast} icon={RoastIcon} tight />
              <SpecCol label={t("acidity")} value={p.acidity} icon={AcidityIcon} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full rounded-lg bg-white py-3 text-sm font-medium text-[#444444] transition-colors hover:bg-[#191919] hover:text-white md:text-base"
          >
            {t("order")}
          </button>
        </div>
      </article>

      <OrderModal
        open={open}
        onClose={() => setOpen(false)}
        product={orderProduct}
      />
    </>
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
      <div className="text-sm font-normal text-[#464646] leading-[110%] md:text-lg">
        {label}
      </div>
      <div className={cn("flex items-center", tight ? "gap-0" : "gap-0.5")}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon
            key={n}
            className={cn(
              "h-4 w-4",
              n <= value ? "text-[#444444]" : "text-[#c9c9c9]",
            )}
          />
        ))}
      </div>
    </div>
  );
}
