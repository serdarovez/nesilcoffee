"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";
import { LOCALE_ORDER, type LocalizedField as LocalizedValue } from "@/lib/i18n-field";
import { inputClass } from "./ui";

const LABELS: Record<string, string> = {
  ru: "RU",
  en: "EN",
  tk: "TK",
  uz: "UZ",
  az: "AZ",
};

type Props = {
  /** Form field prefix; inputs are named `<name>.<locale>`. */
  name: string;
  label: string;
  value?: LocalizedValue | null;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  hint?: string;
  /** Keyed by `<name>.<locale>` or `<name>`. */
  errors?: Record<string, string>;
};

/**
 * Editor for a translatable field.
 *
 * Renders a real input per locale — all five are always in the DOM, only the
 * selected one is visible — so the whole field submits in one request and the
 * form keeps working without JavaScript. Only Russian is required; the other
 * tabs may be left empty and the site falls back to Russian at render time.
 */
export function LocalizedField({
  name,
  label,
  value,
  multiline,
  rows = 4,
  placeholder,
  hint,
  errors,
}: Props) {
  const [active, setActive] = useState<string>(routing.defaultLocale);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(LOCALE_ORDER.map((l) => [l, value?.[l] ?? ""])),
  );

  const fieldError = errors?.[name] ?? errors?.[`${name}.${routing.defaultLocale}`];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">
          {label}
          <span className="ml-1 text-danger">*</span>
        </span>

        <div className="flex gap-1" role="tablist" aria-label={`${label}: язык`}>
          {LOCALE_ORDER.map((locale) => {
            const filled = Boolean(draft[locale]?.trim());
            const isDefault = locale === routing.defaultLocale;
            return (
              <button
                key={locale}
                type="button"
                role="tab"
                aria-selected={active === locale}
                onClick={() => setActive(locale)}
                title={
                  isDefault
                    ? "Обязательный язык"
                    : filled
                      ? "Заполнено"
                      : "Пусто — покажется русская версия"
                }
                className={cn(
                  "relative rounded-md px-2 py-1 text-xs font-semibold transition-colors",
                  active === locale
                    ? "bg-paper-dark text-ink-inverse"
                    : "bg-paper-alt text-ink-3 hover:text-ink",
                )}
              >
                {LABELS[locale] ?? locale.toUpperCase()}
                {!filled && !isDefault && (
                  <span className="ml-1 text-ink-5">·</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {LOCALE_ORDER.map((locale) => {
        const isActive = active === locale;
        const common = {
          name: `${name}.${locale}`,
          value: draft[locale] ?? "",
          onChange: (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => setDraft((d) => ({ ...d, [locale]: e.target.value })),
          placeholder:
            locale === routing.defaultLocale
              ? placeholder
              : "Оставьте пустым — покажется русская версия",
          className: cn(inputClass, fieldError && isActive && "border-danger"),
        };

        return (
          <div key={locale} className={isActive ? "block" : "hidden"}>
            {multiline ? (
              <textarea {...common} rows={rows} className={cn(common.className, "resize-y")} />
            ) : (
              <input type="text" {...common} />
            )}
          </div>
        );
      })}

      {hint && !fieldError && <span className="text-xs text-ink-4">{hint}</span>}
      {fieldError && (
        <span className="inline-flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {fieldError}
        </span>
      )}
    </div>
  );
}
