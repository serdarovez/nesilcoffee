"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { LocalizedField } from "./LocalizedField";
import { MediaPicker, type MediaRef } from "./MediaPicker";
import { Card, Field, FormMessage, SubmitButton, inputClass } from "./ui";
import { saveHeroSlide } from "@/server/actions/carousels";
import type { FormState } from "@/server/form";
import type { LocalizedField as LocalizedValue } from "@/lib/i18n-field";

/** A product as offered in the picker, with everything a slide can inherit. */
export type HeroProductOption = {
  id: string;
  label: string;
  description: string | null;
  imagePath: string | null;
  imageBlurDataUrl: string | null;
};

export type HeroSlideValues = {
  id?: string;
  title?: LocalizedValue | null;
  body?: LocalizedValue | null;
  ctaLabel?: LocalizedValue | null;
  productId?: string | null;
  bgImage?: MediaRef | null;
  productImage?: MediaRef | null;
  overlayColor?: string;
  overlayOpacity?: number;
  isActive?: boolean;
};

export function HeroSlideForm({
  values,
  products,
  sharedDescription,
}: {
  values: HeroSlideValues;
  products: HeroProductOption[];
  /** The shared products.cardDescription message, shown as the last fallback. */
  sharedDescription: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(saveHeroSlide, {});
  const [productId, setProductId] = useState(values.productId ?? "");
  const [bg, setBg] = useState<MediaRef | null>(values.bgImage ?? null);
  const [art, setArt] = useState<MediaRef | null>(values.productImage ?? null);
  const [color, setColor] = useState(values.overlayColor ?? "#1e140f");
  const [opacity, setOpacity] = useState(values.overlayOpacity ?? 65);
  const errors = state.fieldErrors ?? {};

  const product = products.find((p) => p.id === productId) ?? null;

  // What the slide will actually render if the matching field is left blank.
  const inheritedTitle = product?.label ?? "";
  const inheritedBody = product?.description ?? sharedDescription;
  const inheritedArt = art?.path ?? product?.imagePath ?? null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="bgImageId" value={bg?.id ?? ""} />
      <input type="hidden" name="productImageId" value={art?.id ?? ""} />

      <Card className="flex flex-col gap-4">
        <Field
          label="Товар"
          error={errors.productId}
          hint="Заголовок, описание и изображение возьмутся из этого товара. Ниже можно заменить любое поле."
        >
          <select
            name="productId"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className={inputClass}
          >
            <option value="">Без товара — заполню всё вручную</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>

        {product && (
          <div className="flex items-center gap-3 rounded-lg bg-paper-alt p-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-paper">
              {product.imagePath ? (
                <Image
                  src={product.imagePath}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                  {...(product.imageBlurDataUrl
                    ? {
                        placeholder: "blur" as const,
                        blurDataURL: product.imageBlurDataUrl,
                      }
                    : {})}
                />
              ) : (
                <span className="grid h-full place-items-center text-[10px] text-ink-4">
                  нет фото
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5 text-xs">
              <span className="font-semibold text-ink">
                Из товара подставится:
              </span>
              <span className="truncate text-ink-2">
                Заголовок — «{inheritedTitle}»
              </span>
              <span className="line-clamp-1 text-ink-3">
                Текст — {inheritedBody}
              </span>
            </div>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-5">
        <LocalizedField
          name="title"
          required={false}
          label="Заголовок"
          value={values.title ?? undefined}
          multiline
          rows={2}
          placeholder={inheritedTitle || "Карак чай — насыщенный и пряный"}
          errors={errors}
          hint={
            product
              ? "Пусто — покажется название товара"
              : "Обязательно, пока товар не выбран"
          }
        />
        <LocalizedField
          name="body"
          required={false}
          label="Текст"
          value={values.body ?? undefined}
          multiline
          rows={4}
          placeholder={inheritedBody}
          errors={errors}
          hint={
            product
              ? "Пусто — покажется описание товара"
              : "Пусто — покажется общее описание"
          }
        />
        <LocalizedField
          name="ctaLabel"
          required={false}
          label="Надпись на кнопке"
          value={values.ctaLabel ?? undefined}
          placeholder="Попробовать"
          errors={errors}
          hint="Пусто — кнопка не показывается"
        />
      </Card>

      <Card className="flex flex-col gap-5">
        <MediaPicker
          label="Фон слайда"
          value={bg}
          onChange={setBg}
          hint="Широкое фото на весь экран. У товара своего фона нет, поэтому его нужно загрузить."
        />

        <div className="flex flex-col gap-2">
          <MediaPicker
            label="Изображение товара"
            value={art}
            onChange={setArt}
            hint="Необязательно. Пусто — возьмётся изображение выбранного товара."
          />
          {!art && inheritedArt && (
            <div className="flex items-center gap-3 rounded-lg bg-paper-alt p-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-paper">
                <Image
                  src={inheritedArt}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-contain p-1"
                />
              </div>
              <span className="text-xs text-ink-3">
                Сейчас используется изображение товара
              </span>
            </div>
          )}
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="text-sm font-semibold text-ink">Затемнение фона</h2>

        {/* Live preview: the same background, tint and product art the slide
         * will composite, so the colour choice can be judged in place. */}
        <div className="relative h-32 overflow-hidden rounded-lg bg-paper-mute">
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
          {inheritedArt && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={inheritedArt}
              alt=""
              className="absolute inset-y-2 right-3 h-[calc(100%-1rem)] object-contain"
            />
          )}
          <span className="absolute bottom-3 left-3 max-w-[60%] truncate text-sm font-semibold text-white drop-shadow">
            {inheritedTitle || "Так будет выглядеть текст"}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
