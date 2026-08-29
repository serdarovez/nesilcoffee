import "server-only";
import { getTranslations } from "next-intl/server";
import { pick } from "@/lib/i18n-field";
import {
  parseFieldRules,
  applyFieldRules,
  usesDescription,
} from "@/lib/category-fields";
import { formatPack } from "@/lib/product-rules";
import {
  getTeamMembers,
  getCertificates,
  getExperts,
  getHomeSlides,
  getHeroSlides,
  getSettings,
} from "@/server/queries";
import type { TeamMemberView } from "@/components/sections/Team";
import type { CertificateView } from "@/components/sections/Certificates";
import type { Slide } from "@/components/sections/ProductsCarousel";
import type { HeroSlide } from "@/components/sections/ProductsHeroCarousel";

/**
 * Maps cached database rows into the plain, locale-resolved shapes the client
 * components take as props.
 *
 * Resolving `pick()` here rather than in the browser means the client bundle
 * receives one language instead of five, and the components stay unaware that
 * the content is translatable at all.
 */

export async function teamView(locale: string): Promise<TeamMemberView[]> {
  const members = await getTeamMembers();
  return members.map((m) => ({
    id: m.id,
    name: pick(m.name, locale),
    role: pick(m.role, locale),
    phone: m.phone,
    email: m.email,
    avatar: m.avatar?.path ?? null,
    avatarBlurDataUrl: m.avatar?.blurDataUrl ?? null,
  }));
}

export async function certificatesView(
  locale: string,
): Promise<CertificateView[]> {
  const items = await getCertificates();
  return items.map((c) => ({
    id: c.id,
    name: pick(c.name, locale),
    description: pick(c.description, locale),
    image: c.image?.path ?? null,
    blurDataUrl: c.image?.blurDataUrl ?? null,
  }));
}

export type ExpertView = {
  id: string;
  name: string;
  role: string;
  /** Sanitized HTML — written only by the admin form, which allowlists tags. */
  quote: string;
  photo: string | null;
  blurDataUrl: string | null;
};

/**
 * The two About-page experts, plus the heading above them.
 *
 * `fallbackTitle` is the `about.experts.title` message, passed in because
 * message lookup needs the request scope. The heading is stored on the settings
 * singleton rather than on either expert — it is page copy, not a property of a
 * person.
 */
export async function expertsView(
  locale: string,
  fallbackTitle = "",
): Promise<{ title: string; items: ExpertView[] }> {
  const [experts, settings] = await Promise.all([getExperts(), getSettings()]);

  return {
    title: settings?.expertsTitle
      ? pick(settings.expertsTitle, locale, fallbackTitle)
      : fallbackTitle,
    items: experts.map((e) => ({
      id: e.id,
      name: pick(e.name, locale),
      role: pick(e.role, locale),
      quote: pick(e.quote, locale),
      photo: e.photo?.path ?? null,
      blurDataUrl: e.photo?.blurDataUrl ?? null,
    })),
  };
}

export async function homeSlidesView(locale: string): Promise<Slide[]> {
  const [slides, t] = await Promise.all([
    getHomeSlides(),
    getTranslations({ locale, namespace: "products" }),
  ]);
  const arabicaWord = t("arabica");
  const robustaWord = t("robusta");

  return slides.map((s) => {
    const rules = parseFieldRules(s.product.category.fieldRules);
    const spec = applyFieldRules(rules, s.product);

    // The badge above the product name. It used to fall back to a single
    // shared message, so every slide claimed "100% арабика" — including
    // Intenso, whose own copy underneath reads "65% арабики и 35% робусты".
    // Composed from the product's real blend instead, and left null when the
    // category has no blend to state (a tea), so the badge is simply absent
    // rather than wrong.
    const blend = [
      spec.arabica ? `${spec.arabica} ${arabicaWord}` : null,
      spec.robusta ? `${spec.robusta} ${robustaWord}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return {
    id: s.id,
    name: pick(s.product.name, locale),
    // The override wins when set; otherwise the product's own image.
    image: s.imageOverride?.path ?? s.product.image?.path ?? null,
    pieces: spec.pieces,
    roast: spec.roast,
    acidity: spec.acidity,
    // null here tells the component to fall back to the shared message —
    // which is also what a category with descriptions switched off gets.
    description:
      usesDescription(rules) && s.product.description
        ? pick(s.product.description, locale) || null
        : null,
    // An editor-written tagline still wins; the blend is the fallback.
    tagline:
      (s.product.tagline ? pick(s.product.tagline, locale) || null : null) ||
      blend ||
      null,
    blurDataUrl: s.imageOverride?.blurDataUrl ?? s.product.image?.blurDataUrl ?? null,
    };
  });
}

/**
 * Hero slides resolve each field in the same order: the slide's own override
 * first, then the linked product, then the shared message. That is what lets an
 * editor pick a product and get a complete slide without typing anything, while
 * still being able to change any single field.
 *
 * `fallbackBody` is the shared `products.cardDescription` message, resolved by
 * the caller because message lookup needs the request scope.
 */
export async function heroSlidesView(
  locale: string,
  fallbackBody = "",
): Promise<HeroSlide[]> {
  const [slides, t] = await Promise.all([
    getHeroSlides(),
    getTranslations({ locale, namespace: "products" }),
  ]);
  const pieceUnit = t("pieceUnit");
  const gramUnit = t("weightUnit");
  return slides.map((s) => {
    const product = s.product;
    // The linked product's category rules decide both which specs the order
    // dialog prints and whether the product's own description may stand in for
    // the slide body. A slide with no product has neither.
    const rules = product ? parseFieldRules(product.category.fieldRules) : null;
    const productBody =
      rules && usesDescription(rules) && product?.description
        ? pick(product.description, locale)
        : "";

    const title = s.title ? pick(s.title, locale) : "";
    const body = s.body ? pick(s.body, locale) : "";

    return {
      id: s.id,
      bg: s.bgImage?.path ?? null,
      bgBlurDataUrl: s.bgImage?.blurDataUrl ?? null,
      overlayColor: s.overlayColor,
      overlayOpacity: s.overlayOpacity,
      // Override → the product's own image → nothing.
      product: s.productImage?.path ?? product?.image?.path ?? null,
      productOffset: s.productOffset,
      title: title || (product ? pick(product.name, locale) : ""),
      body: body || productBody || fallbackBody,
      cta: s.ctaLabel ? pick(s.ctaLabel, locale) || null : null,
      // Only a slide linked to a product can open the order popup; the hero
      // shows its CTA only when this is non-null. Built from the linked
      // product so the modal has everything it needs (db id, category, weight).
      orderProduct:
        product && rules
          ? {
              id: product.id,
              name: pick(product.name, locale),
              image: s.productImage?.path ?? product.image?.path ?? null,
              category: pick(product.category.name, locale),
              // Composed like the catalog card so the order dialog reads
              // "20 шт × 20 г", with the gram unit localized and fields the
              // category switches off left out.
              weight: formatPack(
                applyFieldRules(rules, product),
                pieceUnit,
                gramUnit,
              ),
              description: productBody || fallbackBody,
            }
          : null,
    };
  });
}

export type ContactInfo = {
  phones: string[];
  email: string;
  address: string;
  /** Receives orders and contact-form hand-offs. Not necessarily displayed. */
  whatsapp: string | null;
  /** Shown on the contacts page. Falls back to `whatsapp` when unset. */
  contactWhatsapp: string | null;
  /** Bare handle; `telegramHref` builds the URL. */
  telegram: string | null;
  instagram: string | null;
  tiktok: string | null;
};

/**
 * Contact details, with the previously hardcoded values as fallbacks so the
 * footer and contacts page still render if the settings row is ever missing.
 */
export async function contactInfo(locale: string): Promise<ContactInfo> {
  const s = await getSettings();
  const phones = Array.isArray(s?.phones)
    ? (s.phones as unknown[]).filter(
        (p): p is string => typeof p === "string" && p.trim().length > 0,
      )
    : [];

  return {
    phones: phones.length ? phones : ["+993 137 32969", "+993 137 32973"],
    email: s?.email ?? "info@nesilcoffee.com",
    address: s ? pick(s.address, locale) : "",
    whatsapp: s?.whatsapp ?? null,
    // One number is the common case: a site that never fills in a separate
    // display number should still show the one it has.
    contactWhatsapp: s?.contactWhatsapp ?? s?.whatsapp ?? null,
    telegram: s?.telegram ?? null,
    instagram: s?.instagram ?? null,
    tiktok: s?.tiktok ?? null,
  };
}

/** Public URL for a stored Telegram handle. */
export function telegramHref(handle: string): string {
  return `https://t.me/${handle}`;
}

/** Display form of a WhatsApp number stored as bare digits. */
export function whatsappLabel(digits: string): string {
  return `+${digits}`;
}

/** Strip everything but digits so a display number becomes a tel: href. */
export function telHref(phone: string): string {
  return `tel:+${phone.replace(/\D/g, "")}`;
}
