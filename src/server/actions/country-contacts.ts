"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/guard";
import { TAGS } from "@/server/cache-tags";
import { revalidateContent } from "@/server/revalidate";
import { isKnownCountry } from "@/lib/countries";
import { type MapPin, parseMapLink } from "@/lib/map-link";
import {
  type FormState,
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
    .regex(/^[A-Z]{2}$/, "Выберите страну из списка")
    .refine(isKnownCountry, "Такой страны нет в списке — выберите из выпадающего"),
  address: localizedRequired,
  isActive: z.boolean(),
});

/**
 * Turn a pasted Google link into coordinates.
 *
 * A `maps.app.goo.gl` link carries no coordinates at all — it is a redirect and
 * nothing else — so the only way to read one is to ask Google where it points.
 * That request can fail (the server sits behind national filtering), so failure
 * is reported as an editable field error telling the editor exactly what to
 * paste instead, never as a crash and never as a silently missing pin.
 */
async function resolvePin(
  raw: string | null,
): Promise<{ pin: MapPin | null } | { error: string }> {
  const parsed = parseMapLink(raw);

  if (parsed.kind === "empty") return { pin: null };
  if (parsed.kind === "pin") return { pin: parsed.pin };
  if (parsed.kind === "unrecognised") {
    return {
      error:
        "В этой ссылке нет координат. Откройте место в Google Картах на компьютере и скопируйте ссылку из адресной строки, либо вставьте координаты через запятую.",
    };
  }

  try {
    const response = await fetch(parsed.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      // Google serves a coordinate-free interstitial to unknown clients.
      headers: { "user-agent": "Mozilla/5.0 (compatible; NesilCoffeeAdmin/1.0)" },
    });
    // The coordinates live in the final URL; some responses only carry them in
    // the body, so both are searched before giving up.
    const fromUrl = parseMapLink(response.url);
    if (fromUrl.kind === "pin") return { pin: fromUrl.pin };
    const fromBody = parseMapLink(await response.text());
    if (fromBody.kind === "pin") return { pin: fromBody.pin };
  } catch {
    // Falls through to the same instruction: no network, no short links.
  }

  return {
    error:
      "Не удалось раскрыть короткую ссылку. Откройте её в браузере и скопируйте полный адрес из адресной строки — он содержит координаты после «@».",
  };
}

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
  // editor gets a sentence rather than a unique-constraint stack trace, and
  // checked before the map link so a duplicate fails instantly instead of
  // waiting on a network round-trip that is about to be thrown away.
  const clash = await prisma.countryContact.findFirst({
    where: { country, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (clash) {
    return formError(`Офис для страны ${country} уже есть — отредактируйте его`);
  }

  const mapLink = readString(formData, "mapLink");
  const resolved = await resolvePin(mapLink);
  if ("error" in resolved) return { fieldErrors: { mapLink: resolved.error } };

  const data = {
    country,
    address,
    phones,
    isActive,
    mapLat: resolved.pin?.lat ?? null,
    mapLng: resolved.pin?.lng ?? null,
    // Stored raw so the editor sees what they pasted when they come back.
    mapUrl: resolved.pin ? (mapLink ?? null) : null,
  };

  if (id) {
    await prisma.countryContact.update({ where: { id }, data });
  } else {
    await prisma.countryContact.create({ data });
  }

  refresh();
  // Back to the list, as every other admin form does — it is also the only
  // screen that shows all the offices at once, which is the thing an editor
  // wants to see after adding one.
  redirect("/admin/offices");
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
