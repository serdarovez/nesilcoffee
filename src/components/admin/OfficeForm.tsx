"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { CountrySelect } from "./CountrySelect";
import { LocalizedField } from "./LocalizedField";
import { MapLinkField } from "./MapLinkField";
import { Card, FormMessage, SubmitButton, inputClass } from "./ui";
import { saveCountryContact } from "@/server/actions/country-contacts";
import type { FormState } from "@/server/form";
import type { LocalizedField as LocalizedValue } from "@/lib/i18n-field";

export type OfficeValues = {
  id?: string;
  country?: string;
  address?: LocalizedValue;
  phones?: string[];
  isActive?: boolean;
  mapUrl?: string | null;
};

/**
 * One branch office. Mirrors the phones repeater on the settings page so the
 * two read the same way — the fields mean the same thing, they just apply to
 * one country instead of to everyone.
 */
export function OfficeForm({
  values,
  taken,
}: {
  values: OfficeValues;
  /** Countries that already have an office, greyed out in the picker. */
  taken?: string[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    saveCountryContact,
    {},
  );
  const [phones, setPhones] = useState<string[]>(
    values.phones?.length ? values.phones : [""],
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Card className="flex flex-col gap-5">
        <CountrySelect
          name="country"
          defaultValue={values.country}
          error={errors.country}
          taken={taken}
        />

        <LocalizedField
          name="address"
          required
          label="Адрес офиса"
          value={values.address}
          multiline
          rows={3}
          errors={errors}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Телефоны</span>
          <div className="flex flex-col gap-2">
            {phones.map((phone, i) => (
              <div key={i} className="flex gap-2">
                <input
                  name="phones"
                  value={phone}
                  onChange={(e) =>
                    setPhones((p) => p.map((v, n) => (n === i ? e.target.value : v)))
                  }
                  placeholder="+994 12 345 67 89"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setPhones((p) => p.filter((_, n) => n !== i))}
                  disabled={phones.length === 1}
                  aria-label="Убрать номер"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line-strong text-ink-3 transition-colors hover:border-danger hover:text-danger disabled:opacity-30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {phones.length < 6 && (
            <button
              type="button"
              onClick={() => setPhones((p) => [...p, ""])}
              className="inline-flex w-fit items-center gap-1 text-xs font-medium text-ink-2 underline underline-offset-2 hover:text-ink"
            >
              <Plus className="h-3 w-3" />
              Добавить номер
            </button>
          )}
          <span className="text-xs text-ink-4">
            Оставьте пустым — покажутся телефоны из «Настроек».
          </span>
        </div>

        <MapLinkField defaultValue={values.mapUrl} error={errors.mapLink} />

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={values.isActive ?? true}
            className="h-4 w-4 accent-[#191919]"
          />
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-ink">Показывать</span>
            <span className="text-xs text-ink-4">
              Снимите галочку — страна снова увидит головной офис.
            </span>
          </span>
        </label>
      </Card>

      <div className="flex items-center gap-3">
        <SubmitButton />
        <FormMessage state={state} />
      </div>
    </form>
  );
}
