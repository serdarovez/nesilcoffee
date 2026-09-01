"use server";

import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/guard";
import { TAGS } from "@/server/cache-tags";
import { revalidateContent } from "@/server/revalidate";
import {
  type FormState,
  OK,
  fieldErrors,
  formError,
  localizedRequired,
  readLocalized,
  readString,
  readBool,
} from "@/server/form";

/**
 * Branch offices — a country's own address and phone numbers.
 *
 * The country code is the identity here, so it is validated hard: two letters,
 * upper-cased on the way in. `countryFromHeaders` returns upper-case ISO codes,
 * and a lower-case row would simply never match a visitor — a failure that
 * looks like "the feature does not work" rather than like bad data.
 */
const schema = z.object({
  country: z
    .string()
    .regex(/^[A-Z]{2}$/, "Код страны из двух латинских букв, например AZ"),
  address: localizedRequired,
  isActive: z.boolean(),
});

/** Ordered, blank entries dropped — same shape as `Setting.phones`. */
function readPhones(formData: FormData): string[] {
  return formData
    .getAll("phones")
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
}

function refresh() {
  revalidateContent(TAGS.countryContacts);
}

export async function saveCountryContact(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = readString(formData, "id");
  const parsed = schema.safeParse({
    country: (readString(formData, "country") ?? "").toUpperCase(),
    address: readLocalized(formData, "address"),
    isActive: readBool(formData, "isActive"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const { country, address, isActive } = parsed.data;
  const phones = readPhones(formData);

  // One office per country, enforced in the database too. Checked here so the
  // editor gets a sentence rather than a unique-constraint stack trace.
  const clash = await prisma.countryContact.findFirst({
    where: { country, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (clash) {
    return formError(`Офис для страны ${country} уже есть — отредактируйте его`);
  }

  const data = { country, address, phones, isActive };

  if (id) {
    await prisma.countryContact.update({ where: { id }, data });
  } else {
    await prisma.countryContact.create({ data });
  }

  refresh();
  return OK;
}

export async function deleteCountryContact(id: string): Promise<void> {
  await requireAdmin();
  await prisma.countryContact.delete({ where: { id } }).catch(() => undefined);
  refresh();
}

export async function toggleCountryContact(id: string): Promise<void> {
  await requireAdmin();
  const current = await prisma.countryContact.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!current) return;
  await prisma.countryContact.update({
    where: { id },
    data: { isActive: !current.isActive },
  });
  refresh();
}
