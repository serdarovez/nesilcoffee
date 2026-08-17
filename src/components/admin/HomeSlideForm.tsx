"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { MediaPicker, type MediaRef } from "./MediaPicker";
import { Card, Field, FormMessage, SubmitButton, inputClass } from "./ui";
import { updateHomeSlide } from "@/server/actions/carousels";
import type { FormState } from "@/server/form";

export function HomeSlideForm({
  values,
  products,
}: {
  values: {
    id: string;
    productId: string;
    imageOverride: MediaRef | null;
    productImagePath: string | null;
    isActive: boolean;
  };
  products: { id: string; label: string }[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    updateHomeSlide,
    {},
  );
  const [override, setOverride] = useState<MediaRef | null>(values.imageOverride);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={values.id} />
      <input type="hidden" name="imageOverrideId" value={override?.id ?? ""} />

      <Card className="flex flex-col gap-5">
        <Field label="Товар" required error={errors.productId}>
          <select
            name="productId"
            defaultValue={values.productId}
            className={inputClass}
            required
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <p className="-mt-2 text-xs text-ink-4">
          Название, степень обжарки и кислотность берутся из карточки товара —
          менять их нужно там.
        </p>
      </Card>

      <Card className="flex flex-col gap-4">
        <MediaPicker
          label="Своё изображение для слайда"
          value={override}
          onChange={setOverride}
          hint="Необязательно. Если не задано, покажется изображение товара."
        />

        {!override && values.productImagePath && (
          <div className="flex items-center gap-3 rounded-lg bg-paper-alt p-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-paper">
              <Image
                src={values.productImagePath}
                alt=""
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </div>
            <span className="text-xs text-ink-3">
              Сейчас используется изображение товара
            </span>
          </div>
        )}
      </Card>

      <Card>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={values.isActive}
            className="h-4 w-4 accent-[#191919]"
          />
          <span className="text-sm font-semibold text-ink">
            Показывать слайд в карусели
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
