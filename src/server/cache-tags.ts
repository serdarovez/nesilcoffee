/**
 * Cache tags shared by the read layer and the admin mutations.
 *
 * Public queries are wrapped in `unstable_cache` with these tags; every admin
 * action that changes the corresponding content calls `revalidateTag` with the
 * same constant. Keeping them in one place is what stops a rename on one side
 * from silently breaking invalidation on the other — a stale-content bug that
 * would otherwise only show up in production.
 */
export const TAGS = {
  products: "products",
  categories: "categories",
  homeCarousel: "home-carousel",
  productsCarousel: "products-carousel",
  team: "team",
  faq: "faq",
  certificates: "certificates",
  settings: "settings",
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];

/** Every tag, for the "rebuild everything" escape hatch in the admin. */
export const ALL_TAGS: CacheTag[] = Object.values(TAGS);
