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
  contactWhatsapp: z
    .string()
    .regex(/^\d{6,15}$/, "Только цифры, в международном формате")
    .nullable(),
  telegram: z.string().min(1).nullable(),
  instagram: z.string().url("Укажите полный адрес").nullable(),
  tiktok: z.string().url("Укажите полный адрес").nullable(),
});

/**
 * Accept a Telegram handle in any of the shapes someone will paste, and store
 * the bare username. Rendering builds the t.me URL, so the database holds one
 * canonical form instead of three.
 */
function normalizeTelegram(input: string | null): string | null {
  if (!input) return null;
  const handle = input
    .trim()
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
  return handle || null;
}

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
    contactWhatsapp:
      readString(formData, "contactWhatsapp")?.replace(/\D/g, "") || null,
    telegram: normalizeTelegram(readString(formData, "telegram")),
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
