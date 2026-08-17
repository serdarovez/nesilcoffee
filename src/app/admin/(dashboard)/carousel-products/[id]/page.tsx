import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, toLocalized } from "@/lib/i18n-field";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { HeroSlideForm } from "@/components/admin/HeroSlideForm";
import { heroProductOptions } from "@/server/admin-options";

export const metadata: Metadata = { title: "Слайд" };

function mediaRef(m: {
  id: string;
  path: string;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  bytes: number | null;
} | null) {
  return m
    ? {
        id: m.id,
        path: m.path,
        width: m.width,
        height: m.height,
        blurDataUrl: m.blurDataUrl,
        bytes: m.bytes,
      }
    : null;
}

export default async function EditHeroSlidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [slide, products, t] = await Promise.all([
    prisma.productsHeroSlide.findUnique({
      where: { id },
      include: { bgImage: true, productImage: true, product: true },
    }),
    heroProductOptions(),
    getTranslations({ locale: "ru", namespace: "products" }),
  ]);

  if (!slide) notFound();

  // Falls back the same way the site does, so the heading names the slide even
  // when its title is inherited rather than typed.
  const heading =
    (slide.title ? pick(slide.title, "ru") : "") ||
    (slide.product ? pick(slide.product.name, "ru") : "") ||
    "Слайд";

  return (
    <PageShell>
      <PageHeader
        title={heading}
        description="Слайд на странице продукции"
        back={{ href: "/admin/carousel-products", label: "К карусели" }}
      />
      <HeroSlideForm
        values={{
          id: slide.id,
          title: slide.title ? toLocalized(slide.title) : null,
          body: slide.body ? toLocalized(slide.body) : null,
          ctaLabel: slide.ctaLabel ? toLocalized(slide.ctaLabel) : null,
          productId: slide.productId,
          bgImage: mediaRef(slide.bgImage),
          productImage: mediaRef(slide.productImage),
          overlayColor: slide.overlayColor,
          overlayOpacity: slide.overlayOpacity,
          isActive: slide.isActive,
        }}
        products={products}
        sharedDescription={t("cardDescription")}
      />
    </PageShell>
  );
}
