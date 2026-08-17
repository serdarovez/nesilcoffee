"use server";

import { revalidateContent } from "@/server/revalidate";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/guard";
import { ALL_TAGS, TAGS } from "@/server/cache-tags";
import {
  type FormState,
  OK,
  fieldErrors,
  localizedRequired,
  readLocalized,
  readString,
} from "@/server/form";

const schema = z.object({
  phones: z.array(z.string().min(1)).max(6, "Не больше шести номеров"),
  email: z.string().email("Некорректный e-mail"),
  address: localizedRequired,
  whatsapp: z
    .string()
    .regex(/^\d{6,15}$/, "Только цифры, в международном формате")
    .nullable(),
  instagram: z.string().url("Укажите полный адрес").nullable(),
  tiktok: z.string().url("Укажите полный адрес").nullable(),
});

export async function saveSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  // Phones arrive as repeated `phones` entries; blank rows are dropped so the
  // footer never renders an empty link.
  const phones = formData
    .getAll("phones")
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);

  const parsed = schema.safeParse({
    phones,
    email: readString(formData, "email") ?? "",
    address: readLocalized(formData, "address"),
    whatsapp: readString(formData, "whatsapp")?.replace(/\D/g, "") || null,
    instagram: readString(formData, "instagram"),
    tiktok: readString(formData, "tiktok"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  await prisma.setting.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });

  revalidateContent(TAGS.settings);
  return OK;
}

/**
 * Manual cache purge — the backstop for the tag-based invalidation.
 *
 * If a mutation ever forgets a tag, or a deploy leaves a stale entry behind,
 * this rebuilds everything rather than leaving the admin with no recourse but
 * a redeploy.
 */
export async function purgeAllCaches(): Promise<void> {
  await requireAdmin();
  revalidateContent(...ALL_TAGS);
}
