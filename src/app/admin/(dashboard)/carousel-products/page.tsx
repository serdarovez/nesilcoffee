import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick } from "@/lib/i18n-field";
import { PageShell, PageHeader, EmptyState } from "@/components/admin/ui";
import {
  HeroCarouselManager,
  type HeroSlideRow,
} from "@/components/admin/HeroCarouselManager";

export const metadata: Metadata = { title: "Карусель на странице продукции" };

export default async function ProductsCarouselPage() {
  await requireAdmin();

  const slides = await prisma.productsHeroSlide.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { bgImage: true, productImage: true },
  });

  const rows: HeroSlideRow[] = slides.map((s) => ({
    id: s.id,
    title: pick(s.title, "ru"),
    bgPath: s.bgImage?.path ?? null,
    artPath: s.productImage?.path ?? null,
    overlayColor: s.overlayColor,
    overlayOpacity: s.overlayOpacity,
    isActive: s.isActive,
  }));

  return (
    <PageShell>
      <PageHeader
        title="Карусель на странице продукции"
        description="Большие слайды в верхней части страницы продукции. Перетащите за левый край, чтобы изменить порядок."
        action={{ href: "/admin/carousel-products/new", label: "Добавить слайд" }}
      />

      {rows.length === 0 ? (
        <EmptyState message="Пока нет слайдов" />
      ) : (
        <HeroCarouselManager slides={rows} />
      )}
    </PageShell>
  );
}
