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

const schema = z.object({
  name: localizedRequired,
  description: localizedOptional,
  tagline: localizedOptional,
  slug: z
    .string()
    .min(1, "Укажите адрес")
    .regex(/^[a-z0-9-]+$/, "Только строчные латинские буквы, цифры и дефис"),
  categoryId: z.string().min(1, "Выберите категорию"),
  weight: z.string().min(1, "Укажите вес или объём"),
  arabica: z.string().nullable(),
  robusta: z.string().nullable(),
  roast: z.number().int().min(1, "От 1 до 5").max(5, "От 1 до 5"),
  acidity: z.number().int().min(1, "От 1 до 5").max(5, "От 1 до 5"),
  imageId: z.string().nullable(),
  isActive: z.boolean(),
});

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
    weight: readString(formData, "weight") ?? "",
    arabica: readString(formData, "arabica"),
    robusta: readString(formData, "robusta"),
    roast: readInt(formData, "roast") ?? 0,
    acidity: readInt(formData, "acidity") ?? 0,
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
    select: { id: true },
  });
  if (!category) return formError("Выбранная категория недоступна");

  // Empty localized fields are stored as NULL rather than {}, so the render
  // layer falls back to the shared message instead of an empty string.
  const description = Object.keys(data.description).length ? data.description : null;
  const tagline = Object.keys(data.tagline).length ? data.tagline : null;

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
        weight: data.weight,
        arabica: data.arabica,
        robusta: data.robusta,
        roast: data.roast,
        acidity: data.acidity,
        imageId: data.imageId,
        isActive: data.isActive,
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
        weight: data.weight,
        arabica: data.arabica,
        robusta: data.robusta,
        roast: data.roast,
        acidity: data.acidity,
        imageId: data.imageId,
        isActive: data.isActive,
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
    select: { isActive: true },
  });
  if (!current) return;

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
