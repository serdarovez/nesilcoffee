import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/server/db";
import { TAGS } from "@/server/cache-tags";

/**
 * Cached reads for the public site.
 *
 * Each function is wrapped in `unstable_cache` with no `revalidate`, so entries
 * live until an admin mutation calls `revalidateTag` with the matching tag.
 * Pages therefore stay as fast as the fully static site they replaced, and an
 * edit shows up within a second of saving.
 *
 * Queries return raw rows rather than locale-resolved strings on purpose: one
 * cache entry then serves all five locales, instead of five near-identical
 * copies. Callers resolve text with `pick(field, locale)` at render time.
 *
 * Note `unstable_cache` rather than the `use cache` directive — the latter
 * requires `cacheComponents: true`, which changes prerendering behaviour across
 * every existing page. See docs/backend-blueprint.html.
 */

const live = { deletedAt: null, isActive: true };

export const getCategoriesWithProducts = unstable_cache(
  async () =>
    prisma.category.findMany({
      where: live,
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          where: live,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: { image: true },
        },
      },
    }),
  ["categories-with-products"],
  { tags: [TAGS.categories, TAGS.products] },
);

export const getHomeSlides = unstable_cache(
  async () =>
    prisma.homeSlide.findMany({
      where: {
        isActive: true,
        // A slide whose product was hidden or deleted is skipped rather than
        // rendering a blank card.
        product: { deletedAt: null, isActive: true },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        imageOverride: true,
        product: { include: { image: true } },
      },
    }),
  ["home-slides"],
  { tags: [TAGS.homeCarousel, TAGS.products] },
);

export const getHeroSlides = unstable_cache(
  async () =>
    prisma.productsHeroSlide.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        bgImage: true,
        productImage: true,
        // Slides inherit their headline, copy and artwork from the linked
        // product unless overridden, so the product travels with the slide.
        product: { include: { image: true } },
      },
    }),
  ["hero-slides"],
  { tags: [TAGS.productsCarousel, TAGS.products] },
);

export const getTeamMembers = unstable_cache(
  async () =>
    prisma.teamMember.findMany({
      where: live,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { avatar: true },
    }),
  ["team-members"],
  { tags: [TAGS.team] },
);

export const getFaqItems = unstable_cache(
  async () =>
    prisma.faqItem.findMany({
      where: live,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ["faq-items"],
  { tags: [TAGS.faq] },
);

export const getCertificates = unstable_cache(
  async () =>
    prisma.certificate.findMany({
      where: live,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { image: true },
    }),
  ["certificates"],
  { tags: [TAGS.certificates] },
);

export const getSettings = unstable_cache(
  async () => prisma.setting.findUnique({ where: { id: 1 } }),
  ["settings"],
  { tags: [TAGS.settings] },
);
