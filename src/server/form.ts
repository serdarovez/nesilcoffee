import "server-only";
import { z } from "zod";
import { routing, localeLabel } from "@/i18n/routing";
import type { LocalizedField } from "@/lib/i18n-field";

/** Shape returned by every admin form action, consumed via useActionState. */
export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export const OK: FormState = { ok: true };

export function formError(error: string): FormState {
  return { ok: false, error };
}

/**
 * Turn a ZodError into the per-field map the forms render. Nested paths are
 * flattened with dots so `name.ru` addresses a locale tab directly.
 */
export function fieldErrors(error: z.ZodError): FormState {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !fields[key]) fields[key] = issue.message;
  }
  return {
    ok: false,
    error: "Проверьте заполнение полей",
    fieldErrors: fields,
  };
}

/**
 * Collect a localized field out of FormData.
 *
 * LocalizedField renders one input per locale named `<field>.<locale>`, so the
 * form still submits correctly without JavaScript and no client-side JSON
 * encoding sits between the user and the database.
 */
export function readLocalized(
  formData: FormData,
  field: string,
): LocalizedField {
  const out: LocalizedField = {};
  for (const locale of routing.locales) {
    const raw = formData.get(`${field}.${locale}`);
    if (typeof raw === "string" && raw.trim()) {
      out[locale] = raw.trim();
    }
  }
  return out;
}

/** Read an optional trimmed string, treating blanks as absent. */
export function readString(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readInt(formData: FormData, key: string): number | null {
  const raw = readString(formData, key);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function readBool(formData: FormData, key: string): boolean {
  const raw = formData.get(key);
  return raw === "on" || raw === "true" || raw === "1";
}

/**
 * Localized field where *every* locale must be filled.
 *
 * One issue is raised per missing locale, pathed at that locale, so
 * `fieldErrors()` flattens it to `name.en` and the form can mark the offending
 * language tab instead of showing one vague message on the field.
 */
export const localizedRequired = z
  .record(z.string(), z.string())
  .superRefine((value, ctx) => {
    for (const locale of routing.locales) {
      if (!value[locale]?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: [locale],
          message: `Заполните версию «${localeLabel[locale]}»`,
        });
      }
    }
  });

export const localizedOptional = z.record(z.string(), z.string());

/**
 * Slugify for URLs. Transliterates Cyrillic so a Russian-named record still
 * produces a readable ASCII slug rather than an empty string.
 */
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
