/**
 * Product rules that the server actions and the admin UI must state in the
 * same words.
 *
 * This lives here rather than in src/server/actions/products.ts because a
 * `"use server"` module may only export async functions. Exporting a plain
 * constant from one does not fail the build — it makes Next drop *every*
 * export in that file, so unrelated imports blow up at request time with
 * "the module has no exports at all". Not a mistake worth making twice.
 *
 * Plain module, no `server-only`: the client-side ProductForm shows the same
 * sentence next to the visibility checkbox.
 */

/** Why an imageless product cannot be shown on the site. */
export const NO_IMAGE_REASON =
  "Без фотографии товар нельзя показать на сайте — загрузите изображение";

/**
 * A blend percentage worth printing, or null.
 *
 * "0%" is a real stored value: an editor describing a single-origin as
 * "100% arabica, 0% robusta" is stating an absence, not a component. Printed
 * literally it produced "100% арабика · 0% робуста" on the carousel and a
 * "0% — робуста" chip on the card. Anything that parses to zero is therefore
 * treated as absent, while a value that does not parse at all is kept exactly
 * as typed rather than silently dropped.
 */
export function blendShare(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed.replace(",", "."));
  return Number.isFinite(n) && n === 0 ? null : trimmed;
}

/**
 * A gram weight the editor typed as a bare number ("20") or with a Russian
 * gram suffix ("200 гр", "18 г"). Anything else — a litre, a kilo, an unknown
 * unit — is left exactly as typed.
 */
const GRAM_WEIGHT = /^(\d+(?:[.,]\d+)?)\s*(?:гр|г|g|gr)?$/i;

/**
 * Localize a stored weight for display.
 *
 * The weight column is free text and mixes conventions: older rows carry a
 * baked-in Russian "гр", newer ones are a bare number. Both are grams, so both
 * are re-rendered with the current locale's gram unit (`gramUnit`, e.g. "г" /
 * "g" / "q"). A value in any other unit is passed through untouched, so a
 * hypothetical "1 л" still reads "1 л" rather than being mangled.
 */
export function formatWeight(weight: string, gramUnit: string): string {
  const trimmed = weight.trim();
  const m = trimmed.match(GRAM_WEIGHT);
  return m ? `${m[1]} ${gramUnit}` : trimmed;
}

/**
 * The weight badge shown on a card, in the order dialog and in the pre-filled
 * order message.
 *
 * A multi-pack stores the count and the single-unit weight separately, so the
 * two are composed here rather than in each call site — otherwise the card and
 * the WhatsApp message could drift. `pieceUnit` is the translated "pieces"
 * word and `gramUnit` the translated gram symbol, so the badge reads
 * "20 шт × 18 г" in Russian and "20 pcs × 18 g" in English.
 */
export function formatPack(
  product: { weight: string; pieces?: number | null },
  pieceUnit: string,
  gramUnit: string,
): string {
  const weight = formatWeight(product.weight, gramUnit);
  if (!product.pieces) return weight;
  return `${product.pieces} ${pieceUnit} × ${weight}`;
}
