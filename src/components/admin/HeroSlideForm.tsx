"use client";

import { useActionState, useState } from "react";
import { LocalizedField } from "./LocalizedField";
import { MediaPicker, type MediaRef } from "./MediaPicker";
import { Card, Field, FormMessage, SubmitButton, inputClass } from "./ui";
import { saveHeroSlide } from "@/server/actions/carousels";
import type { FormState } from "@/server/form";
import type { LocalizedField as LocalizedValue } from "@/lib/i18n-field";

export type HeroSlideValues = {
  id?: string;
  title?: LocalizedValue;
  body?: LocalizedValue;
  ctaLabel?: LocalizedValue | null;
  productId?: string | null;
  bgImage?: MediaRef | null;
  productImage?: MediaRef | null;
  overlayColor?: string;
  overlayOpacity?: number;
  productWidth?: string;
  isActive?: boolean;
};

export function HeroSlideForm({
  values,
  products,
}: {
  values: HeroSlideValues;
  products: { id: string; label: string }[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(saveHeroSlide, {});
  const [bg, setBg] = useState<MediaRef | null>(values.bgImage ?? null);
  const [art, setArt] = useState<MediaRef | null>(values.productImage ?? null);
  const [color, setColor] = useState(values.overlayColor ?? "#1e140f");
  const [opacity, setOpacity] = useState(values.overlayOpacity ?? 65);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="bgImageId" value={bg?.id ?? ""} />
      <input type="hidden" name="productImageId" value={art?.id ?? ""} />

      <Card className="flex flex-col gap-5">
        <LocalizedField
          name="title"
          label="Заголовок"
          value={values.title}
          multiline
          rows={2}
          placeholder="Карак чай — насыщенный и пряный"
          errors={errors}
        />
        <LocalizedField
          name="body"
          label="Текст"
          value={values.body}
          multiline
          rows={4}
          errors={errors}
        />
        <LocalizedField
          name="ctaLabel"
          label="Надпись на кнопке"
          value={values.ctaLabel ?? undefined}
          placeholder="Попробовать"
          errors={errors}
        />
      </Card>

      <Card className="flex flex-col gap-5">
        <MediaPicker
          label="Фон слайда"
          value={bg}
          onChange={setBg}
          hint="Широкое фото — растягивается на весь экран."
        />
        <MediaPicker
          label="Изображение товара"
          value={art}
          onChange={setArt}
          hint="Обычно упаковка на прозрачном фоне."
        />

        <Field
          label="Связанный товар"
          hint="Необязательно. Пока используется только для справки в админке."
        >
          <select
            name="productId"
            defaultValue={values.productId ?? ""}
            className={inputClass}
          >
            <option value="">Не привязан</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="text-sm font-semibold text-ink">Затемнение фона</h2>

        {/* Live preview: the same colour and opacity the slide will render. */}
        <div className="relative h-28 overflow-hidden rounded-lg bg-paper-mute">
          {bg?.path && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={bg.path}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: color, opacity: opacity / 100 }}
          />
          <span className="absolute bottom-2 left-3 text-sm font-semibold text-white drop-shadow">
            Так будет выглядеть текст
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Цвет" required error={errors.overlayColor}>
            <div className="flex gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Выбрать цвет"
                className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-paper"
              />
              <input
                name="overlayColor"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={inputClass}
              />
            </div>
          </Field>

          <Field label={`Плотность — ${opacity}%`} required error={errors.overlayOpacity}>
            <input
              name="overlayOpacity"
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="h-10 w-full accent-[#191919]"
            />
          </Field>

          <Field
            label="Ширина товара"
            required
            error={errors.productWidth}
            hint="Доля ширины экрана"
          >
            <input
              name="productWidth"
              defaultValue={values.productWidth ?? "42%"}
              placeholder="42%"
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={values.isActive ?? true}
            className="h-4 w-4 accent-[#191919]"
          />
          <span className="text-sm font-semibold text-ink">Показывать слайд</span>
        </label>
      </Card>

      <div className="flex items-center gap-3">
        <SubmitButton />
        <FormMessage state={state} />
      </div>
    </form>
  );
}
