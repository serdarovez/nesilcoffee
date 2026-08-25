"use server";

import { revalidateContent } from "@/server/revalidate";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/guard";
import { TAGS } from "@/server/cache-tags";
import {
  type FormState,
  fieldErrors,
  formError,
  localizedRequired,
  readLocalized,
  readString,
  readBool,
  slugify,
} from "@/server/form";
import {
  PRODUCT_FIELDS,
  FIELD_MODES,
  type CategoryFieldRules,
} from "@/lib/category-fields";

const schema = z.object({
  name: localizedRequired,
  slug: z
    .string()
    .min(1, "Укажите адрес")
    .regex(/^[a-z0-9-]+$/, "Только строчные латинские буквы, цифры и дефис"),
  isActive: z.boolean(),
  // Unlike the parser in src/lib/category-fields.ts, which is total by design,
  // this reads form input — so it is validated rather than defaulted.
  fieldRules: z.record(
    z.enum(PRODUCT_FIELDS.map((f) => f.key) as [string, ...string[]]),
    z.enum(FIELD_MODES as unknown as [string, ...string[]]),
  ),
});

/**
 * Read the rules matrix out of the form.
 *
 * A field whose radio group is missing falls back to its default rather than
 * disappearing, so a partially-submitted form cannot quietly switch a spec off
 * for a whole category.
 */
function readFieldRules(formData: FormData): CategoryFieldRules {
  return Object.fromEntries(
    PRODUCT_FIELDS.map((field) => {
      const raw = readString(formData, `fieldRules.${field.key}`);
      const mode = FIELD_MODES.find((m) => m === raw) ?? field.defaultMode;
      return [field.key, mode];
    }),
  ) as CategoryFieldRules;
}

function refresh() {
  revalidateContent(TAGS.categories);
  // Category labels are rendered as the section headings above the product
  // grids, so the products view is stale until it is refreshed too.
  revalidateContent(TAGS.products);
}

export async function saveCategory(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = readString(formData, "id");
  const name = readLocalized(formData, "name");
  const rawSlug = readString(formData, "slug");

  const parsed = schema.safeParse({
    name,
    slug: rawSlug ? slugify(rawSlug) : slugify(name.ru ?? ""),
    isActive: readBool(formData, "isActive"),
    fieldRules: readFieldRules(formData),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const clash = await prisma.category.findFirst({
    where: { slug: parsed.data.slug, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (clash) return formError("Категория с таким адресом уже существует");

  if (id) {
    await prisma.category.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        isActive: parsed.data.isActive,
        fieldRules: parsed.data.fieldRules,
      },
    });
  } else {
    const last = await prisma.category.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        isActive: parsed.data.isActive,
        fieldRules: parsed.data.fieldRules,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });
  }

  refresh();
  redirect("/admin/categories");
}

export async function toggleCategory(id: string): Promise<void> {
  await requireAdmin();
  const current = await prisma.category.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!current) return;

  await prisma.category.update({
    where: { id },
    data: { isActive: !current.isActive },
  });
  refresh();
}

export async function deleteCategory(id: string): Promise<void> {
  await requireAdmin();

  // The schema restricts deleting a category that still has products, which
  // would otherwise orphan them. Soft-delete the row instead and let the admin
  // move the products first.
  const products = await prisma.product.count({
    where: { categoryId: id, deletedAt: null },
  });
  if (products > 0) return;

  await prisma.category.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  refresh();
}

export async function restoreCategory(id: string): Promise<void> {
  await requireAdmin();
  await prisma.category.update({
    where: { id },
    data: { deletedAt: null },
  });
  refresh();
}

export async function moveCategory(id: string, direction: -1 | 1): Promise<void> {
  await requireAdmin();

  const all = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  const index = all.findIndex((c) => c.id === id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= all.length) return;

  [all[index], all[target]] = [all[target], all[index]];

  // Rewrite the whole ordering in one transaction: seeded rows can share
  // sort values, so swapping only two rows is not reliably stable.
  await prisma.$transaction(
    all.map((c, i) =>
      prisma.category.update({ where: { id: c.id }, data: { sortOrder: i } }),
    ),
  );
  refresh();
}

/**
 * Persist a drag-and-drop reorder of the categories: sortOrder = position in
 * `ids`. The products page renders one block per category in this order, so
 * this controls which category's products appear first on the site.
 */
export async function reorderCategories(ids: string[]): Promise<void> {
  await requireAdmin();
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.category.update({ where: { id }, data: { sortOrder: i } }),
    ),
  );
  refresh();
}
