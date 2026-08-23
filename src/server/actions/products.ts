"use server";

import { revalidateContent } from "@/server/revalidate";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/guard";
import { TAGS } from "@/server/cache-tags";
import {
  type FormState,
  fieldErrors,
  formError,
  localizedRequired,
  localizedOptional,
  readLocalized,
  readString,
  readInt,
  readBool,
  slugify,
} from "@/server/form";
import {
  PRODUCT_FIELDS,
  parseFieldRules,
  writableSpecs,
  type CategoryFieldRules,
} from "@/lib/category-fields";

/**
 * Everything that is the same for every product.
 *
 * The six spec fields are deliberately absent: whether each is required,
 * optional or absent altogether depends on the chosen category, which is not
 * known until this schema has already parsed `categoryId`. They are validated
 * by `checkSpecs` below instead.
 */
const schema = z.object({
  name: localizedRequired,
  description: localizedOptional,
  tagline: localizedOptional,
  slug: z
    .string()
    .min(1, "Укажите адрес")
    .regex(/^[a-z0-9-]+$/, "Только строчные латинские буквы, цифры и дефис"),
  categoryId: z.string().min(1, "Выберите категорию"),
  imageId: z.string().nullable(),
  isActive: z.boolean(),
});

type Specs = {
  weight: string | null;
  pieces: number | null;
  arabica: string | null;
  robusta: string | null;
  roast: number | null;
  acidity: number | null;
};

function readSpecs(formData: FormData): Specs {
  return {
    weight: readString(formData, "weight"),
    pieces: readInt(formData, "pieces"),
    arabica: readString(formData, "arabica"),
    robusta: readString(formData, "robusta"),
    roast: readInt(formData, "roast"),
    acidity: readInt(formData, "acidity"),
  };
}

/**
 * Validate the spec fields against the chosen category's rules.
 *
 * Enforced here and not only in the form because the form decides what to
 * render from the same rules — and a Server Action is reachable by direct POST
 * regardless of what was rendered. Errors are keyed by field name so the form
 * marks the offending input.
 */
function checkSpecs(
  specs: Specs,
  rules: CategoryFieldRules,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of PRODUCT_FIELDS) {
    const mode = rules[field.key];
    if (mode === "off") continue;

    const value = specs[field.key];
    const blank = value === null || value === "";

    if (mode === "required" && blank) {
      errors[field.key] = `Укажите «${field.label}»`;
      continue;
    }
    if (blank) continue;

    if (field.key === "roast" || field.key === "acidity") {
      const n = value as number;
      if (n < 1 || n > 5) errors[field.key] = "От 1 до 5";
    }
    if (field.key === "pieces") {
      const n = value as number;
      if (n < 1) errors[field.key] = "Не меньше одной штуки";
    }
  }

  return errors;
}

/**
 * A product with no photo cannot be shown on the site.
 *
 * Every card, carousel slide and order dialog renders the product image
 * unconditionally, so an imageless active product is not a cosmetic problem —
 * it used to crash the page. The rule is enforced here rather than in the form
 * because Server Actions are directly reachable by POST, and because the same
 * situation arises from paths the form never sees: deleting the image from the
 * gallery, or a second tab saving stale state.
 *
 * The admin UI mirrors this (a confirm dialog on save, a disabled toggle in the
 * list) but is only ever an explanation of what the server will do anyway. The
 * wording it uses is NO_IMAGE_REASON in src/lib/product-rules.ts — a
 * `"use server"` file cannot export a constant.
 */

function refresh() {
  revalidateContent(TAGS.products);
  // Both carousels read product name, roast and acidity live, so editing a
  // product changes what they render.
  revalidateContent(TAGS.homeCarousel);
  revalidateContent(TAGS.productsCarousel);
}

export async function saveProduct(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = readString(formData, "id");
  const name = readLocalized(formData, "name");
  const rawSlug = readString(formData, "slug");

  const parsed = schema.safeParse({
    name,
    description: readLocalized(formData, "description"),
    tagline: readLocalized(formData, "tagline"),
    slug: rawSlug ? slugify(rawSlug) : slugify(name.ru ?? ""),
    categoryId: readString(formData, "categoryId") ?? "",
    imageId: readString(formData, "imageId"),
    isActive: readBool(formData, "isActive"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const data = parsed.data;

  const clash = await prisma.product.findFirst({
    where: { slug: data.slug, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (clash) return formError("Товар с таким адресом уже существует");

  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, deletedAt: null },
    select: { id: true, fieldRules: true },
  });
  if (!category) return formError("Выбранная категория недоступна");

  const rules = parseFieldRules(category.fieldRules);
  const specs = readSpecs(formData);

  const specErrors = checkSpecs(specs, rules);
  if (Object.keys(specErrors).length > 0) {
    return {
      ok: false,
      error: "Проверьте заполнение полей",
      fieldErrors: specErrors,
    };
  }

  // Fields the category switches off are left out of the write entirely, so
  // whatever is stored survives a save. See writableSpecs().
  const specWrite = writableSpecs(rules, {
    // `weight` is NOT NULL in the schema, so it is normalized before the rule
    // is applied rather than after.
    weight: specs.weight ?? "",
    pieces: specs.pieces,
    arabica: specs.arabica,
    robusta: specs.robusta,
    roast: specs.roast,
    acidity: specs.acidity,
  });

  // Empty localized fields are stored as NULL rather than {}, so the render
  // layer falls back to the shared message instead of an empty string.
  const description = Object.keys(data.description).length ? data.description : null;
  const tagline = Object.keys(data.tagline).length ? data.tagline : null;

  // The invariant, applied to whatever the form submitted. The dialog in
  // ProductForm has already told the editor this is coming.
  const isActive = data.imageId ? data.isActive : false;

  if (id) {
    await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        // Prisma.DbNull writes SQL NULL; a plain `null` on a Json column means
        // the JSON value `null`, which would defeat the fallback check.
        description: description ?? Prisma.DbNull,
        tagline: tagline ?? Prisma.DbNull,
        slug: data.slug,
        categoryId: data.categoryId,
        ...specWrite,
        imageId: data.imageId,
        isActive,
      },
    });
  } else {
    const last = await prisma.product.findFirst({
      where: { categoryId: data.categoryId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    await prisma.product.create({
      data: {
        name: data.name,
        description: description ?? Prisma.DbNull,
        tagline: tagline ?? Prisma.DbNull,
        slug: data.slug,
        categoryId: data.categoryId,
        // `weight` is NOT NULL, so a category that switches it off still needs
        // a value written on create; the card omits an empty badge.
        weight: specs.weight ?? "",
        ...specWrite,
        imageId: data.imageId,
        isActive,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });
  }

  refresh();
  redirect("/admin/products");
}

export async function toggleProduct(id: string): Promise<void> {
  await requireAdmin();
  const current = await prisma.product.findUnique({
    where: { id },
    select: { isActive: true, imageId: true },
  });
  if (!current) return;

  // Turning a product *off* is always allowed; turning it back on without a
  // photo is not. The list disables this button for exactly this case, so
  // reaching here means a direct POST or a stale page — refuse quietly rather
  // than writing a state the site cannot render.
  if (!current.isActive && !current.imageId) return;

  await prisma.product.update({
    where: { id },
    data: { isActive: !current.isActive },
  });
  refresh();
}

export async function deleteProduct(id: string): Promise<void> {
  await requireAdmin();
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  refresh();
}

export async function restoreProduct(id: string): Promise<void> {
  await requireAdmin();
  await prisma.product.update({
    where: { id },
    data: { deletedAt: null },
  });
  refresh();
}

export async function moveProduct(id: string, direction: -1 | 1): Promise<void> {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id },
    select: { categoryId: true },
  });
  if (!product) return;

  // Ordering is per category — the site renders one grid per category, so a
  // global ordering would not correspond to anything on screen.
  const siblings = await prisma.product.findMany({
    where: { categoryId: product.categoryId, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  const index = siblings.findIndex((p) => p.id === id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= siblings.length) return;

  [siblings[index], siblings[target]] = [siblings[target], siblings[index]];

  await prisma.$transaction(
    siblings.map((p, i) =>
      prisma.product.update({ where: { id: p.id }, data: { sortOrder: i } }),
    ),
  );
  refresh();
}
