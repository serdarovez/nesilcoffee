"use client";

import { useActionState, useState, useTransition } from "react";
import { Plus, X, RefreshCw, Check } from "lucide-react";
import { LocalizedField } from "./LocalizedField";
import { Card, Field, FormMessage, SubmitButton, inputClass } from "./ui";
import { saveSettings, purgeAllCaches } from "@/server/actions/settings";
import type { FormState } from "@/server/form";
import type { LocalizedField as LocalizedValue } from "@/lib/i18n-field";

export type SettingsValues = {
  phones: string[];
  email: string;
  address?: LocalizedValue;
  whatsapp?: string | null;
  contactWhatsapp?: string | null;
  telegram?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
};

export function SettingsForm({ values }: { values: SettingsValues }) {
  const [state, formAction] = useActionState<FormState, FormData>(saveSettings, {});
  const [phones, setPhones] = useState<string[]>(
    values.phones.length ? values.phones : [""],
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">
            Телефоны<span className="ml-1 text-danger">*</span>
          </span>
          <div className="flex flex-col gap-2">
            {phones.map((phone, i) => (
              <div key={i} className="flex gap-2">
                <input
                  name="phones"
                  value={phone}
                  onChange={(e) =>
                    setPhones((p) =>
                      p.map((v, n) => (n === i ? e.target.value : v)),
                    )
                  }
                  placeholder="+993 137 32969"
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
            Показываются в подвале и на странице контактов, в этом порядке.
          </span>
        </div>

        <Field label="E-mail" required error={errors.email}>
          <input
            name="email"
            type="email"
            defaultValue={values.email}
            placeholder="info@nesilcoffee.com"
            className={inputClass}
            required
          />
        </Field>

        <LocalizedField
          name="address"
          required
          label="Адрес"
          value={values.address}
          multiline
          rows={3}
          errors={errors}
        />
      </Card>

      {/* Two groups, because the numbers do two unrelated jobs. Kept apart
       * on screen so nobody changes where orders arrive while meaning to
       * update what visitors see. */}
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-ink">Куда приходят заказы</h2>
          <p className="text-xs text-ink-4">
            Этот номер получает сообщения из формы заказа и формы обратной
            связи. На сайте он не показывается.
          </p>
        </div>
        <Field
          label="WhatsApp для заказов"
          error={errors.whatsapp}
          hint="Только цифры в международном формате, например 99363308311"
        >
          <input
            name="whatsapp"
            defaultValue={values.whatsapp ?? ""}
            placeholder="99363308311"
            className={inputClass}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-ink">Показывать на сайте</h2>
          <p className="text-xs text-ink-4">
            Контакты в блоке «Мессенджер» и «Социальные сети» на странице
            контактов.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="WhatsApp"
            error={errors.contactWhatsapp}
            hint="Пусто — покажется номер для заказов"
          >
            <input
              name="contactWhatsapp"
              defaultValue={values.contactWhatsapp ?? ""}
              placeholder="99312345678"
              className={inputClass}
            />
          </Field>
          <Field
            label="Telegram"
            error={errors.telegram}
            hint="Имя пользователя или ссылка — сохранится как @имя"
          >
            <input
              name="telegram"
              defaultValue={values.telegram ? `@${values.telegram}` : ""}
              placeholder="@nesilcoffee"
              className={inputClass}
            />
          </Field>
          <Field label="Instagram" error={errors.instagram}>
            <input
              name="instagram"
              type="url"
              defaultValue={values.instagram ?? ""}
              placeholder="https://instagram.com/nesilcoffee"
              className={inputClass}
            />
          </Field>
          <Field label="TikTok" error={errors.tiktok}>
            <input
              name="tiktok"
              type="url"
              defaultValue={values.tiktok ?? ""}
              placeholder="https://tiktok.com/@nesilcoffee"
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <SubmitButton />
        <FormMessage state={state} />
      </div>

      <PurgeCard />
    </form>
  );
}

/**
 * Manual cache purge. Lives outside the settings form's own submit so using it
 * never risks saving half-edited contact details.
 */
function PurgeCard() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 border-dashed">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-ink">Обновить кэш сайта</span>
        <span className="max-w-prose text-xs text-ink-4">
          Обычно не нужно — сайт обновляется сам при каждом сохранении. Нажмите,
          если изменения почему-то не появились на сайте.
        </span>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await purgeAllCaches();
            setDone(true);
            setTimeout(() => setDone(false), 3000);
          })
        }
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-line-strong px-3 text-sm text-ink-2 transition-colors hover:border-ink hover:text-ink disabled:opacity-60"
      >
        {done ? (
          <>
            <Check className="h-4 w-4 text-success" />
            Обновлено
          </>
        ) : (
          <>
            <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {pending ? "Обновление…" : "Обновить"}
          </>
        )}
      </button>
    </Card>
  );
}
