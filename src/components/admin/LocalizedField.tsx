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
  /**
   * What the schema behind this field actually demands. Mandatory rather than
   * defaulted so a new call site cannot silently inherit the wrong marker —
   * the two must agree or the form lies about what it will accept.
   *
   *  - `true`      — every locale must be filled (`localizedRequired`).
   *  - `"default"` — only Russian is required; the rest fall back to it.
   *  - `false`     — the whole field may be left blank.
   */
  required: boolean | "default";
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
  required,
  value,
  multiline,
  rows = 4,
  placeholder,
  hint,
  errors,
}: Props) {
  // `required` carries three states; unpack it once rather than re-testing the
  // literal at every marker below.
  const requireAll = required === true;
  const requireDefaultOnly = required === "default";

  const [active, setActive] = useState<string>(routing.defaultLocale);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(LOCALE_ORDER.map((l) => [l, value?.[l] ?? ""])),
  );

  // Errors now arrive per locale (`name.en`), so resolve them per tab and keep
  // the field-level key as a fallback for non-locale issues.
  const localeErrors = Object.fromEntries(
    LOCALE_ORDER.map((l) => [l, errors?.[`${name}.${l}`]]),
  ) as Record<string, string | undefined>;
  const fieldError = errors?.[name] ?? localeErrors[active];
  const missingLocales = LOCALE_ORDER.filter((l) => localeErrors[l]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">
          {label}
          {requireAll && (
            <span className="ml-1 text-xs font-normal text-danger">
              * все языки
            </span>
          )}
          {requireDefaultOnly && (
            <span className="ml-1 text-xs font-normal text-danger">
              * русский
            </span>
          )}
          {!requireAll && !requireDefaultOnly && (
            <span className="ml-1.5 text-xs font-normal text-ink-4">
              необязательно
            </span>
          )}
        </span>

        <div className="flex gap-1" role="tablist" aria-label={`${label}: язык`}>
          {LOCALE_ORDER.map((locale) => {
            const filled = Boolean(draft[locale]?.trim());
            const isDefault = locale === routing.defaultLocale;
            // Which tabs actually have to be filled: all of them, or only
            // Russian. Everything else may stay blank and falls back.
            const mustFill = requireAll || (requireDefaultOnly && isDefault);
            return (
              <button
                key={locale}
                type="button"
                role="tab"
                aria-selected={active === locale}
                onClick={() => setActive(locale)}
                title={
                  mustFill
                    ? filled
                      ? "Заполнено"
                      : "Обязательный язык — заполните"
                    : isDefault
                      ? "Основной язык"
                      : filled
                        ? "Заполнено"
                        : "Пусто — покажется русская версия"
                }
                className={cn(
                  "relative rounded-md px-2 py-1 text-xs font-semibold transition-colors",
                  active === locale
                    ? "bg-paper-dark text-ink-inverse"
                    : localeErrors[locale]
                      ? "bg-danger/10 text-danger"
                      : "bg-paper-alt text-ink-3 hover:text-ink",
                )}
              >
                {LABELS[locale] ?? locale.toUpperCase()}
                {/* Markers sit on the tab, not the label — the requirement is
                 * per language, so this is where it is actionable. */}
                {mustFill && !filled && (
                  <span className="ml-0.5 text-danger">*</span>
                )}
                {!mustFill && !filled && !isDefault && (
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
              : requireAll
                ? "Перевод обязателен"
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

      {hint && !fieldError && missingLocales.length === 0 && (
        <span className="text-xs text-ink-4">{hint}</span>
      )}
      {fieldError && (
        <span className="inline-flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {fieldError}
        </span>
      )}
      {/* The active tab only reports its own error, so list the rest — the
       * missing language is usually on a tab that is not currently open. */}
      {missingLocales.length > 0 && (
        <span className="text-xs text-danger">
          Не заполнено:{" "}
          {missingLocales.map((l) => LABELS[l] ?? l.toUpperCase()).join(", ")}
        </span>
      )}
    </div>
  );
}
