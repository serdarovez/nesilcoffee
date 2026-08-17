import "server-only";
import { prisma } from "@/server/db";
import { pick } from "@/lib/i18n-field";
import type { HeroProductOption } from "@/components/admin/HeroSlideForm";

/**
 * Products offered in the hero-slide picker, carrying everything a slide can
 * inherit — label, description and artwork — so the form can show the editor
 * exactly what will be filled in before they save.
 */
export async function heroProductOptions(): Promise<HeroProductOption[]> {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    include: { image: true },
  });

  return products.map((p) => ({
    id: p.id,
    label: pick(p.name, "ru"),
    description: p.description ? pick(p.description, "ru") || null : null,
    imagePath: p.image?.path ?? null,
    imageBlurDataUrl: p.image?.blurDataUrl ?? null,
  }));
}
