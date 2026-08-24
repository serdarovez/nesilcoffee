/**
 * Seeds the database from the content that is currently hardcoded in the app,
 * so that after phase 01 the database mirrors the live site exactly.
 *
 * Sources:
 *   - products / carousels  : the arrays in src/app/[locale]/products/page.tsx,
 *                             ProductsCarousel.tsx and ProductsHeroCarousel.tsx
 *   - all translated copy   : src/messages/{ru,en,tk,uz,az}.json, read at run
 *                             time so the five locales stay in sync with the
 *                             message files rather than being retyped here
 *   - blur placeholders     : src/lib/blur-data.ts
 *
 * Idempotent: every row uses a deterministic id or natural key and is upserted,
 * so re-running only fills gaps and never duplicates. `update: {}` on content
 * rows means a re-run will not clobber edits made in the admin.
 */

import { PrismaClient, type Prisma } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BLUR_DATA } from "../src/lib/blur-data";
import type { CategoryFieldRules } from "../src/lib/category-fields";

const prisma = new PrismaClient();

const LOCALES = ["ru", "en", "tk", "uz", "az"] as const;
type Locale = (typeof LOCALES)[number];

const MESSAGES = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    JSON.parse(
      readFileSync(join(process.cwd(), "src", "messages", `${locale}.json`), "utf8"),
    ) as unknown,
  ]),
) as Record<Locale, unknown>;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Turn every locale of a localized value into rich-text HTML.
 *
 * Rich-text columns (FaqItem.answer, Expert.quote) hold HTML, but the message
 * files stay plain text so a translator never has to edit markup — get that
 * wrong and the value is still stored, just broken. The two conventions
 * understood here are the ones the copy actually uses:
 *
 *   blank line   -> a new <p>
 *   "- " prefix  -> an <li> in a <ul> (a run of them is one list)
 *   single \n    -> <br> inside the current paragraph
 *
 * Everything is escaped first, so a stray `<` in the copy is text rather than
 * markup. The output is limited to <p>, <br>, <ul> and <li>, all of which are
 * on the allowlist in sanitizeRichText() — this produces nothing that editing
 * the same field in the admin would strip back out.
 */
function paragraphs(value: Prisma.InputJsonValue): Prisma.InputJsonValue {
  const out: Record<string, string> = {};
  for (const [locale, text] of Object.entries(
    value as Record<string, string>,
  )) {
    out[locale] = richTextFromPlain(text);
  }
  return out;
}

function richTextFromPlain(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim());
      if (lines.every((l) => l.startsWith("- "))) {
        const items = lines
          .map((l) => `<li>${escape(l.slice(2).trim())}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${lines.map(escape).join("<br>")}</p>`;
    })
    .join("");
}

/** Read a dotted path out of a parsed message file. Array indices work too. */
function dot(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

/**
 * Build a localized JSON value by reading the same message path from all five
 * files. Missing or blank translations are simply absent, which is exactly
 * what `pick()` expects.
 */
function localized(path: string): Prisma.InputJsonValue {
  const out: Record<string, string> = {};
  for (const locale of LOCALES) {
    const value = dot(MESSAGES[locale], path);
    if (typeof value === "string" && value.trim().length > 0) {
      out[locale] = value;
    }
  }
  if (!out.ru) {
    throw new Error(`Seed: no Russian copy found at message path "${path}"`);
  }
  return out;
}

/** Product names are brand names — identical in every locale. */
function brand(name: string): Prisma.InputJsonValue {
  return { ru: name };
}

function mimeFor(path: string): string {
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

/**
 * Register an existing `public/` asset as a Media row. Uploaded files will
 * carry real dimensions from sharp; these legacy rows only need the path and
 * the already-generated blur placeholder, since every consumer renders them
 * with `fill`.
 */
const mediaIds = new Map<string, string>();

async function media(path: string): Promise<string> {
  const cached = mediaIds.get(path);
  if (cached) return cached;

  const row = await prisma.media.upsert({
    where: { path },
    update: {},
    create: {
      path,
      blurDataUrl: BLUR_DATA[path] ?? null,
      mimeType: mimeFor(path),
    },
  });
  mediaIds.set(path, row.id);
  return row.id;
}

/* -------------------------------------------------------------------------- */
/*  Source data — mirrors the current hardcoded arrays                        */
/* -------------------------------------------------------------------------- */

type SeedProduct = {
  slug: string;
  name: string;
  image: string;
  /** Weight of ONE unit; multiplied by `pieces` on the card when set. */
  weight: string;
  /** Units per pack, for stick and sachet formats. */
  pieces?: number;
  arabica: string | null;
  robusta: string | null;
  roast: number;
  acidity: number;
};

type SeedCategory = {
  slug: string;
  /** Message path holding the translated category label. */
  messagePath: string;
  /**
   * Which product fields this category uses. Mirrors what migration
   * 20260823093050 writes to the categories that already existed, so a fresh
   * seed and a migrated database end up identical.
   */
  fieldRules: CategoryFieldRules;
  products: SeedProduct[];
};

const CATEGORIES: SeedCategory[] = [
  {
    slug: "bean",
    fieldRules: { weight: "required", pieces: "off", arabica: "optional", robusta: "optional", roast: "required", acidity: "required" },
    messagePath: "products.categories.bean",
    products: [
      { slug: "speciale", name: "Speciale", image: "/products/speciale-main.png",  weight: "1000 гр", arabica: "65%",  robusta: "35%", roast: 3, acidity: 3 },
      { slug: "intenso",  name: "Intenso",  image: "/products/speciale-var-a.png", weight: "1000 гр", arabica: "100%", robusta: null,  roast: 5, acidity: 4 },
      { slug: "classico", name: "Classico", image: "/products/grain-1.png",        weight: "1000 гр", arabica: "45%",  robusta: "55%", roast: 4, acidity: 3 },
      { slug: "la-crema", name: "La Crema", image: "/products/grain-2.png",        weight: "1000 гр", arabica: "80%",  robusta: "20%", roast: 3, acidity: 2 },
      { slug: "espresso", name: "Espresso", image: "/products/grain-3.png",        weight: "1000 гр", arabica: "60%",  robusta: "40%", roast: 5, acidity: 3 },
    ],
  },
  {
    slug: "instant",
    fieldRules: { weight: "required", pieces: "required", arabica: "optional", robusta: "off", roast: "required", acidity: "off" },
    messagePath: "products.categories.instant",
    products: [
      { slug: "coffee-latte",  name: "Coffee Latte",  image: "/products/instant-1.png", weight: "18 гр", pieces: 20, arabica: "100%", robusta: null, roast: 3, acidity: 2 },
      { slug: "cappuccino",    name: "Cappuccino",    image: "/products/instant-2.png", weight: "18 гр", pieces: 20, arabica: "100%", robusta: null, roast: 3, acidity: 2 },
      { slug: "caramel-latte", name: "Caramel Latte", image: "/products/instant-3.png", weight: "18 гр", pieces: 20, arabica: "100%", robusta: null, roast: 2, acidity: 2 },
      { slug: "hazelnut",      name: "Hazelnut",      image: "/products/instant-4.png", weight: "18 гр", pieces: 20, arabica: "100%", robusta: null, roast: 3, acidity: 2 },
      { slug: "vanilla",       name: "Vanilla",       image: "/products/instant-5.png", weight: "18 гр", pieces: 20, arabica: "100%", robusta: null, roast: 2, acidity: 2 },
    ],
  },
  {
    slug: "freeze-dried",
    fieldRules: { weight: "required", pieces: "off", arabica: "optional", robusta: "off", roast: "required", acidity: "required" },
    messagePath: "products.categories.freezeDried",
    products: [
      { slug: "gold",     name: "Gold",     image: "/products/grain-4.png",                weight: "95 гр", arabica: "100%", robusta: null, roast: 4, acidity: 3 },
      { slug: "platinum", name: "Platinum", image: "/products/grain-5.png",                weight: "95 гр", arabica: "100%", robusta: null, roast: 5, acidity: 3 },
      { slug: "black",    name: "Black",    image: "/products/latte-carousel.png",         weight: "95 гр", arabica: "100%", robusta: null, roast: 5, acidity: 4 },
      { slug: "aroma",    name: "Aroma",    image: "/products/product-carousel-var-c.png", weight: "95 гр", arabica: "100%", robusta: null, roast: 4, acidity: 3 },
      { slug: "classic",  name: "Classic",  image: "/products/product-carousel-var-d.png", weight: "95 гр", arabica: "100%", robusta: null, roast: 4, acidity: 3 },
    ],
  },
  {
    slug: "tea",
    fieldRules: { weight: "required", pieces: "off", arabica: "off", robusta: "off", roast: "off", acidity: "off" },
    messagePath: "products.categories.tea",
    products: [
      { slug: "karak", name: "Karak", image: "/products/tea-1.png", weight: "200 гр", arabica: null, robusta: null, roast: 3, acidity: 2 },
    ],
  },
];

/**
 * Home carousel. Each slide points at a bean product but shows different art
 * than that product's own card — preserved here as an image override.
 *
 * NOTE: the hardcoded slides also carried their own roast/acidity values that
 * disagree with the same product's card (e.g. Classico is roast 3 in the
 * carousel and roast 4 on its card). Specs now come from the product, so those
 * four slides render the product's real figures. See the phase-01 notes.
 */
const HOME_SLIDES: { id: string; productSlug: string; imageOverride: string }[] = [
  { id: "home-slide-1", productSlug: "intenso",  imageOverride: "/products/speciale-main.png" },
  { id: "home-slide-2", productSlug: "classico", imageOverride: "/products/speciale-var-a.png" },
  { id: "home-slide-3", productSlug: "speciale", imageOverride: "/products/latte-carousel.png" },
  { id: "home-slide-4", productSlug: "la-crema", imageOverride: "/products/product-carousel-var-c.png" },
  { id: "home-slide-5", productSlug: "espresso", imageOverride: "/products/product-carousel-var-d.png" },
];

/**
 * Products-page hero. `productSlug` is null for the espresso slide: its copy
 * describes an instant espresso that has no matching product in the catalog,
 * so linking it to the bean Espresso would be a guess. It stays editorial-only.
 */
const HERO_SLIDES: {
  id: string;
  key: "karak" | "espresso" | "latte";
  productSlug: string | null;
  bg: string;
  productImage: string;
  overlayColor: string;
  overlayOpacity: number;
}[] = [
  {
    id: "hero-slide-1",
    key: "karak",
    productSlug: "karak",
    bg: "/products/hero-slide-1-bg.jpg",
    productImage: "/products/product-carousel-var-d.png",
    overlayColor: "#245314",
    overlayOpacity: 40,
  },
  {
    id: "hero-slide-2",
    key: "espresso",
    productSlug: null,
    bg: "/products/hero-slide-2-bg.jpg",
    productImage: "/products/grain-2.png",
    overlayColor: "#1e140f",
    overlayOpacity: 65,
  },
  {
    id: "hero-slide-3",
    key: "latte",
    productSlug: "coffee-latte",
    bg: "/products/products-hero-bg.jpg",
    productImage: "/products/instant-1.png",
    overlayColor: "#1e140f",
    overlayOpacity: 65,
  },
];

const TEAM_AVATAR = "/sections/team/adel-sakhieva.png";
const TEAM_COUNT = 5;
const FAQ_COUNT = 6;

/// The About page has exactly two expert cards; these are their message keys.
const EXPERT_KEYS = ["one", "two"] as const;
/// public/ ships only expert-1, so both cards seed with it. Replace the second
/// from the admin once a photo of Bayramguly exists.
const EXPERT_PHOTO = "/sections/about/expert-1.png";

const CERTIFICATES: { id: string; key: "iso" | "halal"; image: string }[] = [
  { id: "cert-iso",   key: "iso",   image: "/certificates/iso-9001.png" },
  { id: "cert-halal", key: "halal", image: "/certificates/halal.png" },
];

/* -------------------------------------------------------------------------- */
/*  Seed                                                                      */
/* -------------------------------------------------------------------------- */

async function seedCatalog() {
  const productIds = new Map<string, string>();

  for (const [categoryIndex, category] of CATEGORIES.entries()) {
    const categoryRow = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        slug: category.slug,
        name: localized(category.messagePath),
        fieldRules: category.fieldRules,
        sortOrder: categoryIndex,
      },
    });

    for (const [productIndex, product] of category.products.entries()) {
      const imageId = await media(product.image);

      const row = await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: {
          slug: product.slug,
          name: brand(product.name),
          // description and tagline stay null: the site falls back to the
          // shared `products.cardDescription` / `home.products.tagline`
          // messages, which is exactly what it renders today.
          weight: product.weight,
          pieces: product.pieces ?? null,
          arabica: product.arabica,
          robusta: product.robusta,
          roast: product.roast,
          acidity: product.acidity,
          imageId,
          categoryId: categoryRow.id,
          sortOrder: productIndex,
        },
      });
      productIds.set(product.slug, row.id);
    }
  }

  console.log(
    `  categories: ${CATEGORIES.length}   products: ${productIds.size}`,
  );
  return productIds;
}

async function seedCarousels(productIds: Map<string, string>) {
  for (const [index, slide] of HOME_SLIDES.entries()) {
    const productId = productIds.get(slide.productSlug);
    if (!productId) throw new Error(`Seed: unknown product "${slide.productSlug}"`);

    await prisma.homeSlide.upsert({
      where: { id: slide.id },
      update: {},
      create: {
        id: slide.id,
        productId,
        imageOverrideId: await media(slide.imageOverride),
        sortOrder: index,
      },
    });
  }

  for (const [index, slide] of HERO_SLIDES.entries()) {
    await prisma.productsHeroSlide.upsert({
      where: { id: slide.id },
      update: {},
      create: {
        id: slide.id,
        productId: slide.productSlug ? productIds.get(slide.productSlug) : null,
        title: localized(`products.hero.slides.${slide.key}.title`),
        body: localized(`products.hero.slides.${slide.key}.body`),
        ctaLabel: localized("products.hero.cta"),
        bgImageId: await media(slide.bg),
        productImageId: await media(slide.productImage),
        overlayColor: slide.overlayColor,
        overlayOpacity: slide.overlayOpacity,
        sortOrder: index,
      },
    });
  }

  console.log(
    `  home slides: ${HOME_SLIDES.length}   hero slides: ${HERO_SLIDES.length}`,
  );
}

async function seedPageContent() {
  const avatarId = await media(TEAM_AVATAR);

  for (let i = 0; i < TEAM_COUNT; i++) {
    const phone = dot(MESSAGES.ru, `home.team.members.${i}.phone`);
    const email = dot(MESSAGES.ru, `home.team.members.${i}.email`);

    await prisma.teamMember.upsert({
      where: { id: `team-${i + 1}` },
      update: {},
      create: {
        id: `team-${i + 1}`,
        name: localized(`home.team.members.${i}.name`),
        role: localized(`home.team.members.${i}.role`),
        phone: typeof phone === "string" ? phone : null,
        email: typeof email === "string" ? email : null,
        avatarId,
        sortOrder: i,
      },
    });
  }

  for (let i = 0; i < FAQ_COUNT; i++) {
    await prisma.faqItem.upsert({
      where: { id: `faq-${i + 1}` },
      update: {},
      create: {
        id: `faq-${i + 1}`,
        question: localized(`contacts.faq.items.${i}.q`),
        // Rich text since the Tiptap editor landed. Wrapped here so a fresh
        // seed matches what migration 20260823084500 did to existing rows.
        answer: paragraphs(localized(`contacts.faq.items.${i}.a`)),
        sortOrder: i,
      },
    });
  }

  // Exactly two, matching the two cards the About page renders. `update: {}`
  // as everywhere else, so re-seeding never clobbers edits made in the admin.
  for (const [index, key] of EXPERT_KEYS.entries()) {
    await prisma.expert.upsert({
      where: { id: `expert-${index + 1}` },
      update: {},
      create: {
        id: `expert-${index + 1}`,
        name: localized(`about.experts.${key}.name`),
        role: localized(`about.experts.${key}.role`),
        quote: paragraphs(localized(`about.experts.${key}.quote`)),
        // Both start on the one photo that exists in public/. The second is
        // meant to be replaced from the admin — there is no expert-2 asset.
        photoId: await media(EXPERT_PHOTO),
        sortOrder: index,
      },
    });
  }

  for (const [index, cert] of CERTIFICATES.entries()) {
    await prisma.certificate.upsert({
      where: { id: cert.id },
      update: {},
      create: {
        id: cert.id,
        name: localized(`home.certificates.items.${cert.key}.name`),
        description: localized(`home.certificates.items.${cert.key}.desc`),
        imageId: await media(cert.image),
        sortOrder: index,
      },
    });
  }

  console.log(
    `  team: ${TEAM_COUNT}   faq: ${FAQ_COUNT}   certificates: ${CERTIFICATES.length}   experts: ${EXPERT_KEYS.length}`,
  );
}

async function seedSettings() {
  // Values currently duplicated across Footer.tsx, the contacts page and the
  // JSON-LD block in [locale]/layout.tsx.
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      phones: ["+993 137 32969", "+993 137 32973"],
      email: "info@nesilcoffee.com",
      address: localized("contacts.contact.address"),
      whatsapp: "99313732969",
      instagram: "https://instagram.com/nesilcoffee",
      tiktok: "https://tiktok.com/@nesilcoffee",
    },
  });
  console.log("  settings: 1 (singleton)");
}

async function main() {
  console.log("Seeding NesilCoffee content…\n");

  const productIds = await seedCatalog();
  await seedCarousels(productIds);
  await seedPageContent();
  await seedSettings();

  const mediaCount = await prisma.media.count();
  console.log(`  media: ${mediaCount}\n`);
  console.log("Done. The database now mirrors the current site content.");
}

main()
  .catch((error) => {
    console.error("\nSeed failed:\n", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
