"use client";

import { useActionState, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { LocalizedField } from "./LocalizedField";
import { MediaPicker, type MediaRef } from "./MediaPicker";
import { ConfirmDialog } from "./ConfirmDialog";
import { Card, Field, FormMessage, SubmitButton, inputClass } from "./ui";
import { saveProduct } from "@/server/actions/products";
import { NO_IMAGE_REASON } from "@/lib/product-rules";
import {
  DEFAULT_FIELD_RULES,
  CATEGORY_RULE_FIELDS,
  type CategoryFieldRules,
  type ProductFieldKey,
} from "@/lib/category-fields";
import type { FormState } from "@/server/form";
import type { LocalizedField as LocalizedValue } from "@/lib/i18n-field";

export type ProductFormValues = {
  id?: string;
  name?: LocalizedValue;
  description?: LocalizedValue | null;
  tagline?: LocalizedValue | null;
  slug?: string;
  categoryId?: string;
  weight?: string;
  pieces?: number | null;
  arabica?: string | null;
  robusta?: string | null;
  roast?: number | null;
  acidity?: number | null;
  image?: MediaRef | null;
  isActive?: boolean;
};

export type CategoryOption = {
  id: string;
  label: string;
  /** Which fields this category uses. Drives what the form below renders. */
  rules: CategoryFieldRules;
};

export function ProductForm({
  values,
  categories,
}: {
  values: ProductFormValues;
  categories: CategoryOption[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(saveProduct, {});
  const [image, setImage] = useState<MediaRef | null>(values.image ?? null);
  // Controlled so the confirm dialog can react to the checkbox live, rather
  // than reading the DOM at submit time.
  const [isActive, setIsActive] = useState(values.isActive ?? true);
  const [asking, setAsking] = useState(false);
  // Controlled so the spec fields below follow the dropdown immediately, rather
  // than only after a save round-trip.
  const [categoryId, setCategoryId] = useState(values.categoryId ?? "");
  const errors = state.fieldErrors ?? {};

  // Falls back to the defaults for "no category picked yet", which is the same
  // set of rules a category with nothing stored gets.
  const rules =
    categories.find((c) => c.id === categoryId)?.rules ?? DEFAULT_FIELD_RULES;

  /** A field the current category switches off is not rendered at all. */
  const uses = (key: ProductFieldKey) => rules[key] !== "off";
  const required = (key: ProductFieldKey) => rules[key] === "required";
  const hiddenFields = CATEGORY_RULE_FIELDS.filter(
    (f) => rules[f.key] === "off",
  );

  const formRef = useRef<HTMLFormElement>(null);
  // A ref, not state: `requestSubmit()` below runs before a state update would
  // be visible to the submit handler, so the flag has to be readable
  // synchronously.
  const confirmedRef = useRef(false);

  // Saving without a photo is allowed — it just takes the product off the
  // site, which is what the server does regardless (see NO_IMAGE_REASON).
  // Asking first means that is never a surprise.
  const willBeHidden = !image && isActive;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (willBeHidden && !confirmedRef.current) {
      event.preventDefault();
      setAsking(true);
      return;
    }
    // Re-arm: if the action comes back with a validation error the form stays
    // on screen, and the next attempt should ask again.
    confirmedRef.current = false;
  };

  const confirmAndSave = () => {
    confirmedRef.current = true;
    setAsking(false);
    formRef.current?.requestSubmit();
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="imageId" value={image?.id ?? ""} />

      <Card className="flex flex-col gap-5">
        <LocalizedField
          name="name"
          required
          label="Название"
          value={values.name}
          placeholder="Intenso"
          errors={errors}
          hint="Для фирменных названий обычно достаточно одной русской версии — она покажется во всех языках."
        />

        {/* No address field: nothing on the site routes by product slug — the
         * catalog is one page and the admin edits by id — so it is derived
         * from the name on save and made unique automatically. Two products
         * may share a name, which is the whole point of not asking. */}
        <Field label="Категория" required error={errors.categoryId}>
          <select
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="" disabled>
              Выберите категорию
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </Card>

      <Card className="flex flex-col gap-5">
        <MediaPicker
          label="Изображение"
          value={image}
          onChange={setImage}
          hint="Прозрачный PNG или WebP. Длинная сторона будет уменьшена до 2400 px."
        />

        {/* Which of these appear is decided by the selected category. A field
         * it marks «Нет» is not rendered, and the server leaves whatever is
         * already stored for it alone — so switching the rule back restores
         * the value rather than resurrecting a blank. */}
        <div className="grid gap-4 sm:grid-cols-3">
          {uses("weight") && (
            <Field
              label="Вес / объём"
              required={required("weight")}
              error={errors.weight}
              hint={
                uses("pieces")
                  ? "Вес одной штуки — на карточке умножится на количество"
                  : undefined
              }
            >
              <input
                name="weight"
                defaultValue={values.weight ?? ""}
                placeholder={uses("pieces") ? "18 гр" : "1000 гр"}
                className={inputClass}
                required={required("weight")}
              />
            </Field>
          )}
          {uses("pieces") && (
            <Field
              label="Штук в упаковке"
              required={required("pieces")}
              error={errors.pieces}
              hint="На карточке: «20 шт × 18 гр»"
            >
              <input
                name="pieces"
                type="number"
                min={1}
                defaultValue={values.pieces ?? ""}
                placeholder="20"
                className={inputClass}
                required={required("pieces")}
              />
            </Field>
          )}
          {uses("arabica") && (
            <Field
              label="Арабика"
              required={required("arabica")}
              error={errors.arabica}
              hint={required("arabica") ? undefined : "Пусто — не показывать"}
            >
              <input
                name="arabica"
                defaultValue={values.arabica ?? ""}
                placeholder="100%"
                className={inputClass}
                required={required("arabica")}
              />
            </Field>
          )}
          {uses("robusta") && (
            <Field
              label="Робуста"
              required={required("robusta")}
              error={errors.robusta}
              hint={required("robusta") ? undefined : "Пусто — не показывать"}
            >
              <input
                name="robusta"
                defaultValue={values.robusta ?? ""}
                placeholder="35%"
                className={inputClass}
                required={required("robusta")}
              />
            </Field>
          )}
        </div>

        {(uses("roast") || uses("acidity")) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {uses("roast") && (
              <SpecSelect
                name="roast"
                label="Степень обжарки"
                required={required("roast")}
                value={values.roast}
                error={errors.roast}
              />
            )}
            {uses("acidity") && (
              <SpecSelect
                name="acidity"
                label="Кислотность"
                required={required("acidity")}
                value={values.acidity}
                error={errors.acidity}
              />
            )}
          </div>
        )}

        {hiddenFields.length > 0 && (
          <p className="text-xs text-ink-4">
            Не используются в этой категории:{" "}
            {hiddenFields.map((f) => f.label.toLowerCase()).join(", ")}. Изменить
            — в настройках категории.
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-5">
        {/* Whether this appears at all — and whether it may be left blank — is
         * the category's call, same as the spec fields above. `"default"` is
         * the strictest it gets: Russian must be filled, the other four still
         * fall back to it. */}
        {uses("description") && (
          <LocalizedField
            name="description"
            required={required("description") ? "default" : false}
            label="Описание"
            value={values.description ?? undefined}
            multiline
            rows={4}
            errors={errors}
            hint={
              required("description")
                ? "Обязательно для этой категории — напишите хотя бы русскую версию."
                : "Оставьте пустым — покажется общее описание из языковых файлов."
            }
          />
        )}
        <LocalizedField
          name="tagline"
          required={false}
          label="Подпись"
          value={values.tagline ?? undefined}
          errors={errors}
          hint="Например «100% арабика». Пусто — покажется общая подпись."
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            name="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 accent-[#191919]"
          />
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-ink">Показывать на сайте</span>
            <span className="text-xs text-ink-4">
              Снимите галочку, чтобы временно убрать товар, не удаляя его
            </span>
          </span>
        </label>

        {willBeHidden && (
          <p className="inline-flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            <ImageOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {NO_IMAGE_REASON}. При сохранении товар будет скрыт.
          </p>
        )}
      </Card>

      <div className="flex items-center gap-3">
        <SubmitButton />
        <FormMessage state={state} />
      </div>

      <ConfirmDialog
        open={asking}
        title="Сохранить без фотографии?"
        confirmLabel="Сохранить и скрыть"
        onCancel={() => setAsking(false)}
        onConfirm={confirmAndSave}
      >
        <p>
          У товара нет изображения, поэтому он будет{" "}
          <strong className="font-semibold text-ink">скрыт с сайта</strong>.
        </p>
        <p className="text-ink-3">
          Чтобы снова показать его, загрузите фотографию и включите «Показывать
          на сайте».
        </p>
      </ConfirmDialog>
    </form>
  );
}

/**
 * A 1–5 spec dropdown.
 *
 * When the category marks the field optional it offers a blank first option:
 * "not specified" is a real answer for a product whose roast nobody measured,
 * and it is distinct from any of the five levels. A required field has no such
 * option, so the browser blocks submission before the server has to.
 */
function SpecSelect({
  name,
  label,
  required,
  value,
  error,
}: {
  name: string;
  label: string;
  required: boolean;
  value?: number | null;
  error?: string;
}) {
  return (
    <Field label={label} required={required} error={error}>
      <select
        name={name}
        defaultValue={value != null ? String(value) : required ? "3" : ""}
        className={inputClass}
        required={required}
      >
        {!required && <option value="">Не указано</option>}
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n} из 5
          </option>
        ))}
      </select>
    </Field>
  );
}
