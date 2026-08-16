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
};

export function ProductCard({
  p,
  categoryLabel,
}: {
  p: Product;
  categoryLabel: string;
}) {
  const t = useTranslations("products");
  const [open, setOpen] = useState(false);

  const orderProduct: OrderProduct = {
    name: p.name,
    image: p.image,
    category: categoryLabel,
    weight: p.weight,
    description: t("cardDescription"),
  };

  return (
    <>
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
            onClick={() => setOpen(true)}
            className="w-full rounded-lg bg-white py-3.5 text-base font-medium text-[#444444] transition-colors hover:bg-[#191919] hover:text-white md:py-4 md:text-lg"
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
