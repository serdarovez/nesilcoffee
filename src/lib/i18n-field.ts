/**
 * Localized database fields.
 *
 * Text that the admin can translate is stored as a JSONB object keyed by
 * locale — `{ ru: "…", en: "…" }`. Only `ru` is guaranteed to be present:
 * the admin requires the default locale and leaves the other four optional,
 * so a product can ship the moment its Russian copy exists.
 *
 * Every read goes through `pick()`, which resolves in this order:
 *   1. the requested locale, if non-empty
 *   2. the default locale (`ru`)
 *   3. a caller-supplied fallback — normally the corresponding next-intl
 *      message, which is how shared defaults like `products.cardDescription`
 *      keep working for products that have no description of their own.
 */

import { routing, type Locale } from "@/i18n/routing";

export type LocalizedField = Partial<Record<Locale, string>>;

/** Locales in admin tab order: the required default first. */
export const LOCALE_ORDER: readonly Locale[] = [
  routing.defaultLocale,
  ...routing.locales.filter((l) => l !== routing.defaultLocale),
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function nonEmpty(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

/**
 * Read one locale out of a localized field, falling back to the default
 * locale and then to `fallback`.
 *
 * Accepts `unknown` because Prisma types JSONB columns as `JsonValue`, which
 * carries no shape guarantees — validating here means callers never have to.
 */
export function pick(
  field: unknown,
  locale: string,
  fallback = "",
): string {
  const map = asRecord(field);
  if (!map) return fallback;

  return (
    nonEmpty(map[locale]) ??
    nonEmpty(map[routing.defaultLocale]) ??
    fallback
  );
}

/** True when the field has usable copy for the default locale. */
export function hasDefaultLocale(field: unknown): boolean {
  const map = asRecord(field);
  return map !== null && nonEmpty(map[routing.defaultLocale]) !== null;
}

/** Locales this field has actual content for — drives the admin tab badges. */
export function filledLocales(field: unknown): Locale[] {
  const map = asRecord(field);
  if (!map) return [];
  return LOCALE_ORDER.filter((l) => nonEmpty(map[l]) !== null);
}

/**
 * Normalize arbitrary input into a `LocalizedField`, dropping unknown keys
 * and blank values so empty tabs are stored as absent rather than `""`.
 * `pick()` treats both the same, but keeping the column clean makes
 * `filledLocales()` honest.
 */
export function toLocalized(input: unknown): LocalizedField {
  const map = asRecord(input);
  if (!map) return {};

  const out: LocalizedField = {};
  for (const locale of routing.locales) {
    const value = nonEmpty(map[locale]);
    if (value) out[locale] = value.trim();
  }
  return out;
}

/** Read a JSONB string array (e.g. `Setting.phones`) defensively. */
export function pickList(field: unknown): string[] {
  if (!Array.isArray(field)) return [];
  return field.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}
