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
  localizedOptional,
  readLocalized,
  readString,
  readInt,
  readBool,
} from "@/server/form";

/* -------------------------------------------------------------------------- */
/*  Home carousel                                                             */
/* -------------------------------------------------------------------------- */

export async function addHomeSlide(productId: string): Promise<void> {
  await requireAdmin();

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { id: true },
  });
  if (!product) return;

  const last = await prisma.homeSlide.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.homeSlide.create({
    data: { productId, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
  revalidateContent(TAGS.homeCarousel);
}

export async function updateHomeSlide(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = readString(formData, "id");
  const productId = readString(formData, "productId");
  if (!id || !productId) return formError("Не указан слайд или товар");

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { id: true },
  });
  if (!product) return formError("Выбранный товар недоступен");

  await prisma.homeSlide.update({
    where: { id },
    data: {
      productId,
      imageOverrideId: readString(formData, "imageOverrideId"),
      isActive: readBool(formData, "isActive"),
    },
  });

  revalidateContent(TAGS.homeCarousel);
  redirect("/admin/carousel-home");
}

export async function deleteHomeSlide(id: string): Promise<void> {
  await requireAdmin();
  await prisma.homeSlide.delete({ where: { id } }).catch(() => undefined);
  revalidateContent(TAGS.homeCarousel);
}

export async function toggleHomeSlide(id: string): Promise<void> {
  await requireAdmin();
  const c = await prisma.homeSlide.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!c) return;
  await prisma.homeSlide.update({
    where: { id },
    data: { isActive: !c.isActive },
  });
  revalidateContent(TAGS.homeCarousel);
}

/**
 * Persist a drag-and-drop reorder.
 *
 * The client sends the full ordered list, and only ids that actually exist are
 * written — a stale tab holding a deleted slide cannot resurrect it or corrupt
 * the ordering of the rest.
 */
export async function reorderHomeSlides(ids: string[]): Promise<void> {
  await requireAdmin();

  const existing = await prisma.homeSlide.findMany({ select: { id: true } });
  const valid = new Set(existing.map((s) => s.id));
  const ordered = ids.filter((id) => valid.has(id));
  if (ordered.length !== valid.size) return;

  await prisma.$transaction(
    ordered.map((id, index) =>
      prisma.homeSlide.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
  revalidateContent(TAGS.homeCarousel);
}

/* -------------------------------------------------------------------------- */
/*  Products-page hero carousel                                               */
/* -------------------------------------------------------------------------- */

const heroSchema = z
  .object({
    title: localizedOptional,
    body: localizedOptional,
    ctaLabel: localizedOptional,
    productId: z.string().nullable(),
  bgImageId: z.string().nullable(),
  productImageId: z.string().nullable(),
  overlayColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Цвет в формате #1e140f"),
  overlayOpacity: z
    .number()
    .int()
    .min(0, "От 0 до 100")
    .max(100, "От 0 до 100"),
    productAlign: z.enum(["left", "center", "right"]),
    isActive: z.boolean(),
  })
  // A slide with no linked product has nothing to inherit, so it must carry its
  // own headline. With a product selected, every text field is optional.
  .refine((v) => Boolean(v.productId) || Boolean(v.title.ru?.trim()), {
    message: "Выберите товар или заполните заголовок",
    path: ["title"],
  });

export async function saveHeroSlide(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = readString(formData, "id");

  const parsed = heroSchema.safeParse({
    title: readLocalized(formData, "title"),
    body: readLocalized(formData, "body"),
    ctaLabel: readLocalized(formData, "ctaLabel"),
    productId: readString(formData, "productId"),
    bgImageId: readString(formData, "bgImageId"),
    productImageId: readString(formData, "productImageId"),
    overlayColor: readString(formData, "overlayColor") ?? "",
    overlayOpacity: readInt(formData, "overlayOpacity") ?? 65,
    productAlign: readString(formData, "productAlign") ?? "right",
    isActive: readBool(formData, "isActive"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const data = parsed.data;

  // Blank overrides are stored as SQL NULL, not {}, so the render layer can
  // tell "no override, inherit from the product" from "deliberately empty".
  const blankToNull = (v: Record<string, string>) =>
    Object.keys(v).length ? v : Prisma.DbNull;

  const values = {
    ...data,
    title: blankToNull(data.title),
    body: blankToNull(data.body),
    ctaLabel: blankToNull(data.ctaLabel),
  };

  if (id) {
    await prisma.productsHeroSlide.update({ where: { id }, data: values });
  } else {
    const last = await prisma.productsHeroSlide.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    await prisma.productsHeroSlide.create({
      data: { ...values, sortOrder: (last?.sortOrder ?? -1) + 1 },
    });
  }

  revalidateContent(TAGS.productsCarousel);
  redirect("/admin/carousel-products");
}

export async function deleteHeroSlide(id: string): Promise<void> {
  await requireAdmin();
  await prisma.productsHeroSlide.delete({ where: { id } }).catch(() => undefined);
  revalidateContent(TAGS.productsCarousel);
}

export async function toggleHeroSlide(id: string): Promise<void> {
  await requireAdmin();
  const c = await prisma.productsHeroSlide.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!c) return;
  await prisma.productsHeroSlide.update({
    where: { id },
    data: { isActive: !c.isActive },
  });
  revalidateContent(TAGS.productsCarousel);
}

export async function reorderHeroSlides(ids: string[]): Promise<void> {
  await requireAdmin();

  const existing = await prisma.productsHeroSlide.findMany({ select: { id: true } });
  const valid = new Set(existing.map((s) => s.id));
  const ordered = ids.filter((id) => valid.has(id));
  if (ordered.length !== valid.size) return;

  await prisma.$transaction(
    ordered.map((id, index) =>
      prisma.productsHeroSlide.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );
  revalidateContent(TAGS.productsCarousel);
}
