"use client";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { RoastIcon, AcidityIcon } from "@/components/icons/ProductSpecs";
import { OrderModal, type OrderProduct } from "@/components/sections/OrderModal";
import { formatPack } from "@/lib/product-rules";
import { cn } from "@/lib/utils";

export type Product = {
  name: string;
  /** null when the product has no photo. Such a product is never active â
   *  see the invariant in src/server/actions/products.ts â so this only
   *  renders for a preview or a legacy row, never for live catalog copy. */
  image: string | null;
  weight: string;
  /** Units per pack; null for a single container. Composed into the badge. */
  pieces?: number | null;
  arabica: string;
  robusta: string;
  /** null when the product's category switches the spec off, or it is unset.
   *  A missing spec renders as one fewer row, not as a zero. */
  roast: number | null;
  acidity: number | null;
  /** Per-product copy; null means use the shared message. */
  description?: string | null;
  /** Base64 placeholder from the media record, shown while the image loads. */
  blurDataUrl?: string | null;
};

export function ProductCard({
  p,
  categoryLabel,
  fallbackDescription,
  productId,
  whatsapp,
  contactEmail,
}: {
  p: Product;
  categoryLabel: string;
  /** Shared `products.cardDescription` message, resolved on the server. */
  fallbackDescription: string;
  productId?: string;
  /** Business contact channels from site settings, for the order handoff. */
  whatsapp?: string | null;
  contactEmail?: string | null;
}) {
  const t = useTranslations("products");
  const [open, setOpen] = useState(false);

  const description = p.description ?? fallbackDescription;
  const pack = formatPack(p, t("pieceUnit"));

  const orderProduct: OrderProduct = {
    id: productId,
    name: p.name,
    image: p.image,
    category: categoryLabel,
    weight: pack,
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
            {/* A category may switch the weight field off entirely, leaving
             * nothing to put in the badge — render no chip rather than an
             * empty one. */}
            {pack && (
              <span className="inline-flex shrink-0 items-center rounded-md bg-white px-2 py-0.5 font-display text-xs font-bold text-[#444444] md:rounded-lg md:py-1 md:text-sm">
                {pack}
              </span>
            )}
          </div>
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg md:rounded-xl">
            {/* Explicitly lazy (next/image's default without `priority`) so the
             * intent is visible: a catalog page can hold 16+ of these and only
             * the first row is ever above the fold.
             *
             * The blur placeholder comes from the media record rather than the
             * pre-generated map in lib/blur-data, because that map is keyed by
             * public/ path and knows nothing about uploaded files. */}
            {p.image && (
              <Image
                src={p.image}
                alt={p.name}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, (max-width: 1280px) 30vw, 23vw"
                className="object-contain"
                {...(p.blurDataUrl
                  ? { placeholder: "blur" as const, blurDataURL: p.blurDataUrl }
                  : {})}
              />
            )}
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
            {(p.roast !== null || p.acidity !== null) && (
              <div className="flex items-start gap-6">
                {p.roast !== null && (
                  <SpecCol
                    label={t("roast")}
                    value={p.roast}
                    icon={RoastIcon}
                    tight
                  />
                )}
                {p.acidity !== null && (
                  <SpecCol
                    label={t("acidity")}
                    value={p.acidity}
                    icon={AcidityIcon}
                  />
                )}
              </div>
            )}
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
        whatsapp={whatsapp}
        email={contactEmail}
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
