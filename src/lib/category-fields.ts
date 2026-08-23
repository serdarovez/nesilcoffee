/**
 * Which product fields a category uses, and how strictly.
 *
 * A tea has no roast profile and a 20-stick instant pack has no acidity worth
 * printing, but both are products in the same table. Rather than nullable
 * columns everyone has to remember about, each category declares per field
 * whether it is required, optional, or not applicable at all — and the form,
 * the validation and the site all read that one declaration.
 *
 * Plain module, no `server-only` and no zod: the admin's product form is a
 * client component and needs the labels and the mode type. The parser below is
 * a total function — every malformed input resolves to a default rather than
 * throwing — so validating it with a schema would buy nothing a `??` does not.
 * Untrusted *form input* is still zod-validated where it is read, in
 * src/server/actions/categories.ts.
 */

/**
 *  - `required` — the form blocks saving until it is filled.
 *  - `optional` — may be left blank; blank means "do not show it on the site".
 *  - `off`      — not applicable to this category. Hidden in the form and on
 *                 the site, and any value already stored is left untouched so
 *                 switching back restores it.
 */
export type FieldMode = "required" | "optional" | "off";

export const FIELD_MODES: readonly FieldMode[] = [
  "required",
  "optional",
  "off",
] as const;

export const FIELD_MODE_LABEL: Record<FieldMode, string> = {
  required: "Обязательно",
  optional: "Необязательно",
  off: "Нет",
};

export type ProductFieldKey =
  | "weight"
  | "pieces"
  | "arabica"
  | "robusta"
  | "roast"
  | "acidity";

/**
 * The configurable fields, in the order they appear in the product form.
 *
 * `defaultMode` reproduces the behaviour that existed before category rules —
 * weight/roast/acidity required, arabica/robusta optional — so a category with
 * no rules stored (or an unrecognised one) behaves exactly as it always did.
 */
export const PRODUCT_FIELDS: readonly {
  key: ProductFieldKey;
  label: string;
  hint?: string;
  defaultMode: FieldMode;
}[] = [
  { key: "weight", label: "Вес / объём", defaultMode: "required" },
  {
    key: "pieces",
    label: "Штук в упаковке",
    hint: "Для стиков и саше — на карточке покажется «20 шт × 18 гр»",
    defaultMode: "off",
  },
  { key: "arabica", label: "Арабика", defaultMode: "optional" },
  { key: "robusta", label: "Робуста", defaultMode: "optional" },
  { key: "roast", label: "Степень обжарки", defaultMode: "required" },
  { key: "acidity", label: "Кислотность", defaultMode: "required" },
];

export type CategoryFieldRules = Record<ProductFieldKey, FieldMode>;

export const DEFAULT_FIELD_RULES: CategoryFieldRules = Object.fromEntries(
  PRODUCT_FIELDS.map((field) => [field.key, field.defaultMode]),
) as CategoryFieldRules;

function isFieldMode(value: unknown): value is FieldMode {
  return typeof value === "string" && FIELD_MODES.includes(value as FieldMode);
}

/**
 * Read a category's rules out of the JSONB column.
 *
 * Total by design: an unknown key is ignored and an unknown value falls back to
 * that field's default, so adding a field to `PRODUCT_FIELDS` needs no data
 * migration — existing rows simply take the new default until someone edits
 * them. Prisma types JSONB as `JsonValue`, which carries no shape guarantees,
 * which is exactly why this takes `unknown`.
 */
export function parseFieldRules(value: unknown): CategoryFieldRules {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return Object.fromEntries(
    PRODUCT_FIELDS.map((field) => [
      field.key,
      isFieldMode(source[field.key]) ? source[field.key] : field.defaultMode,
    ]),
  ) as CategoryFieldRules;
}

/** Fields this category actually uses, in form order. */
export function activeFields(rules: CategoryFieldRules): ProductFieldKey[] {
  return PRODUCT_FIELDS.filter((f) => rules[f.key] !== "off").map((f) => f.key);
}

/**
 * Fields a category demands that this product has not got.
 *
 * Drives the «заполните» badge in the admin list. Note it never affects whether
 * the product is visible: unlike a missing photo, a missing acidity row just
 * means the card renders one fewer line, which looks entirely normal. Changing
 * a category rule must not silently pull products off the site.
 */
export function missingRequired(
  rules: CategoryFieldRules,
  product: {
    weight: string | null;
    pieces: number | null;
    arabica: string | null;
    robusta: string | null;
    roast: number | null;
    acidity: number | null;
  },
): ProductFieldKey[] {
  return PRODUCT_FIELDS.filter((field) => {
    if (rules[field.key] !== "required") return false;
    const value = product[field.key];
    return value === null || value === undefined || value === "";
  }).map((field) => field.key);
}

export function fieldLabel(key: ProductFieldKey): string {
  return PRODUCT_FIELDS.find((f) => f.key === key)?.label ?? key;
}

/**
 * Blank out the fields a category does not use, for rendering.
 *
 * Necessary because switching a field off deliberately does NOT erase what is
 * stored — that is what makes the rules reversible. The value therefore
 * survives in the database and would still reach the card, so the rules have to
 * be applied again here, at the boundary between the database and the view.
 *
 * Every consumer that shows product specs must go through this: the catalog
 * grid, the home carousel and the products hero all read the same columns.
 */
export function applyFieldRules<
  T extends {
    weight: string;
    pieces: number | null;
    arabica: string | null;
    robusta: string | null;
    roast: number | null;
    acidity: number | null;
  },
>(
  rules: CategoryFieldRules,
  product: T,
): Pick<T, "weight" | "pieces" | "arabica" | "robusta" | "roast" | "acidity"> {
  return {
    weight: (rules.weight === "off" ? "" : product.weight) as T["weight"],
    pieces: (rules.pieces === "off" ? null : product.pieces) as T["pieces"],
    arabica: (rules.arabica === "off" ? null : product.arabica) as T["arabica"],
    robusta: (rules.robusta === "off" ? null : product.robusta) as T["robusta"],
    roast: (rules.roast === "off" ? null : product.roast) as T["roast"],
    acidity: (rules.acidity === "off" ? null : product.acidity) as T["acidity"],
  };
}

/**
 * The subset of spec values a save is allowed to write.
 *
 * Fields the category switches off are omitted entirely rather than set to
 * null, so whatever is stored survives and comes back if the rule is switched
 * on again. Spreading the result into a Prisma `update` is what makes the rules
 * non-destructive — writing null here would quietly erase a product's roast the
 * first time anyone saved it after a category changed.
 *
 * Lives here rather than inline in the action so it sits beside
 * `applyFieldRules`, which is the same rule applied on the way out.
 */
export function writableSpecs<T extends Partial<Record<ProductFieldKey, unknown>>>(
  rules: CategoryFieldRules,
  specs: T,
): Partial<T> {
  const out: Partial<T> = {};
  for (const field of PRODUCT_FIELDS) {
    if (rules[field.key] === "off") continue;
    if (field.key in specs) {
      out[field.key as keyof T] = specs[field.key as keyof T];
    }
  }
  return out;
}
