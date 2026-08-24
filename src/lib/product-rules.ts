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
 * The weight badge shown on a card, in the order dialog and in the pre-filled
 * order message.
 *
 * A multi-pack stores the count and the single-unit weight separately, so the
 * two are composed here rather than in each call site — otherwise the card and
 * the WhatsApp message could drift. `unit` is the translated "pieces" word, so
 * the badge reads "20 шт × 18 гр" in Russian and "20 pcs × 18 gr" in English.
 */
export function formatPack(
  product: { weight: string; pieces?: number | null },
  unit: string,
): string {
  if (!product.pieces) return product.weight;
  return `${product.pieces} ${unit} × ${product.weight}`;
}
