import "server-only";
import { prisma } from "@/server/db";
import { pick } from "@/lib/i18n-field";
import { parseFieldRules, usesDescription } from "@/lib/category-fields";
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
    // The category travels along for its fieldRules: a category that switches
    // descriptions off inherits nothing, and this preview must say so rather
    // than promising copy the slide will not use.
    include: { image: true, category: true },
  });

  return products.map((p) => ({
    id: p.id,
    label: pick(p.name, "ru"),
    description:
      usesDescription(parseFieldRules(p.category.fieldRules)) && p.description
        ? pick(p.description, "ru") || null
        : null,
    imagePath: p.image?.path ?? null,
    imageBlurDataUrl: p.image?.blurDataUrl ?? null,
  }));
}
