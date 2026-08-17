import "server-only";
import { pick } from "@/lib/i18n-field";
import {
  getTeamMembers,
  getCertificates,
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
  }));
}

export async function homeSlidesView(locale: string): Promise<Slide[]> {
  const slides = await getHomeSlides();
  return slides.map((s) => ({
    id: s.id,
    name: pick(s.product.name, locale),
    // The override wins when set; otherwise the product's own image.
    image: s.imageOverride?.path ?? s.product.image?.path ?? "",
    roast: s.product.roast,
    acidity: s.product.acidity,
    // null here tells the component to fall back to the shared message.
    description: s.product.description
      ? pick(s.product.description, locale) || null
      : null,
    tagline: s.product.tagline ? pick(s.product.tagline, locale) || null : null,
    blurDataUrl: s.imageOverride?.blurDataUrl ?? s.product.image?.blurDataUrl ?? null,
  }));
}

export async function heroSlidesView(locale: string): Promise<HeroSlide[]> {
  const slides = await getHeroSlides();
  return slides.map((s) => ({
    id: s.id,
    bg: s.bgImage?.path ?? null,
    bgBlurDataUrl: s.bgImage?.blurDataUrl ?? null,
    overlayColor: s.overlayColor,
    overlayOpacity: s.overlayOpacity,
    product: s.productImage?.path ?? null,
    productWidth: s.productWidth,
    title: pick(s.title, locale),
    body: pick(s.body, locale),
    cta: s.ctaLabel ? pick(s.ctaLabel, locale) || null : null,
  }));
}

export type ContactInfo = {
  phones: string[];
  email: string;
  address: string;
  whatsapp: string | null;
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
    instagram: s?.instagram ?? null,
    tiktok: s?.tiktok ?? null,
  };
}

/** Strip everything but digits so a display number becomes a tel: href. */
export function telHref(phone: string): string {
  return `tel:+${phone.replace(/\D/g, "")}`;
}
