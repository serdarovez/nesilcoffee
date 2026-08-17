import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, toLocalized } from "@/lib/i18n-field";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { HeroSlideForm } from "@/components/admin/HeroSlideForm";

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

  const [slide, products] = await Promise.all([
    prisma.productsHeroSlide.findUnique({
      where: { id },
      include: { bgImage: true, productImage: true },
    }),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  if (!slide) notFound();

  return (
    <PageShell>
      <PageHeader
        title={pick(slide.title, "ru")}
        description="Слайд на странице продукции"
        back={{ href: "/admin/carousel-products", label: "К карусели" }}
      />
      <HeroSlideForm
        values={{
          id: slide.id,
          title: toLocalized(slide.title),
          body: toLocalized(slide.body),
          ctaLabel: slide.ctaLabel ? toLocalized(slide.ctaLabel) : null,
          productId: slide.productId,
          bgImage: mediaRef(slide.bgImage),
          productImage: mediaRef(slide.productImage),
          overlayColor: slide.overlayColor,
          overlayOpacity: slide.overlayOpacity,
          productWidth: slide.productWidth,
          isActive: slide.isActive,
        }}
        products={products.map((p) => ({ id: p.id, label: pick(p.name, "ru") }))}
      />
    </PageShell>
  );
}
