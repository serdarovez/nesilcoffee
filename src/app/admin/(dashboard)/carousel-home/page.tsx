import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick } from "@/lib/i18n-field";
import { parseFieldRules, applyFieldRules } from "@/lib/category-fields";
import { PageShell, PageHeader, EmptyState } from "@/components/admin/ui";
import {
  HomeCarouselManager,
  type HomeSlideRow,
} from "@/components/admin/HomeCarouselManager";

export const metadata: Metadata = { title: "Карусель на главной" };

export default async function HomeCarouselPage() {
  await requireAdmin();

  const [slides, products] = await Promise.all([
    prisma.homeSlide.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        imageOverride: true,
        product: { include: { image: true, category: true } },
      },
    }),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  const rows: HomeSlideRow[] = slides.map((s) => {
    // Same rules the slide itself renders under, so this list never advertises
    // a spec the site does not show.
    const spec = applyFieldRules(
      parseFieldRules(s.product.category.fieldRules),
      s.product,
    );
    return {
    id: s.id,
    productId: s.productId,
    productName: pick(s.product.name, "ru"),
    productActive: s.product.isActive,
    productDeleted: Boolean(s.product.deletedAt),
    roast: spec.roast,
    acidity: spec.acidity,
    imagePath: s.imageOverride?.path ?? s.product.image?.path ?? null,
    hasOverride: Boolean(s.imageOverrideId),
    isActive: s.isActive,
    };
  });

  return (
    <PageShell>
      <PageHeader
        title="Карусель на главной"
        description="Слайды берут название, обжарку и кислотность из товара. Перетащите за левый край, чтобы изменить порядок."
      />

      {rows.length === 0 ? (
        <EmptyState message="В карусели пока нет слайдов" />
      ) : null}

      <HomeCarouselManager
        slides={rows}
        products={products.map((p) => ({ id: p.id, label: pick(p.name, "ru") }))}
      />
    </PageShell>
  );
}
