"use client";

import { useActionState, useState } from "react";
import { LocalizedField } from "./LocalizedField";
import { MediaPicker, type MediaRef } from "./MediaPicker";
import { Card, Field, FormMessage, SubmitButton, inputClass } from "./ui";
import { saveProduct } from "@/server/actions/products";
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
  arabica?: string | null;
  robusta?: string | null;
  roast?: number;
  acidity?: number;
  image?: MediaRef | null;
  isActive?: boolean;
};

export function ProductForm({
  values,
  categories,
}: {
  values: ProductFormValues;
  categories: { id: string; label: string }[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(saveProduct, {});
  const [image, setImage] = useState<MediaRef | null>(values.image ?? null);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Категория"
            required
            error={errors.categoryId}
          >
            <select
              name="categoryId"
              defaultValue={values.categoryId ?? ""}
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

          <Field
            label="Адрес (slug)"
            error={errors.slug}
            hint="Оставьте пустым — создастся из названия"
          >
            <input
              name="slug"
              defaultValue={values.slug ?? ""}
              placeholder="intenso"
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <MediaPicker
          label="Изображение"
          value={image}
          onChange={setImage}
          hint="Прозрачный PNG или WebP. Длинная сторона будет уменьшена до 2400 px."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Вес / объём" required error={errors.weight}>
            <input
              name="weight"
              defaultValue={values.weight ?? ""}
              placeholder="1000 гр"
              className={inputClass}
              required
            />
          </Field>
          <Field label="Арабика" error={errors.arabica} hint="Пусто — не показывать">
            <input
              name="arabica"
              defaultValue={values.arabica ?? ""}
              placeholder="100%"
              className={inputClass}
            />
          </Field>
          <Field label="Робуста" error={errors.robusta} hint="Пусто — не показывать">
            <input
              name="robusta"
              defaultValue={values.robusta ?? ""}
              placeholder="35%"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Степень обжарки" required error={errors.roast}>
            <select
              name="roast"
              defaultValue={String(values.roast ?? 3)}
              className={inputClass}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} из 5
                </option>
              ))}
            </select>
          </Field>
          <Field label="Кислотность" required error={errors.acidity}>
            <select
              name="acidity"
              defaultValue={String(values.acidity ?? 3)}
              className={inputClass}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} из 5
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <LocalizedField
          name="description"
          required={false}
          label="Описание"
          value={values.description ?? undefined}
          multiline
          rows={4}
          errors={errors}
          hint="Оставьте пустым — покажется общее описание из языковых файлов."
        />
        <LocalizedField
          name="tagline"
          required={false}
          label="Подпись"
          value={values.tagline ?? undefined}
          errors={errors}
          hint="Например «100% арабика». Пусто — покажется общая подпись."
        />
      </Card>

      <Card>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={values.isActive ?? true}
            className="h-4 w-4 accent-[#191919]"
          />
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-ink">Показывать на сайте</span>
            <span className="text-xs text-ink-4">
              Снимите галочку, чтобы временно убрать товар, не удаляя его
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
