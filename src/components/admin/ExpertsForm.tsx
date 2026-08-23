"use client";

import { useActionState, useState } from "react";
import { LocalizedField } from "./LocalizedField";
import { RichLocalizedField } from "./RichLocalizedField";
import { MediaPicker, type MediaRef } from "./MediaPicker";
import { Card, FormMessage, SubmitButton } from "./ui";
import { saveExperts } from "@/server/actions/content";
import type { FormState } from "@/server/form";
import type { LocalizedField as LocalizedValue } from "@/lib/i18n-field";

export type ExpertValues = {
  id: string;
  name?: LocalizedValue;
  role?: LocalizedValue;
  quote?: LocalizedValue;
  photo?: MediaRef | null;
};

/**
 * The About page's expert section, edited as one form.
 *
 * There is no add or delete, by design: the layout is two cards side by side
 * and a third or a missing one would break it. That is why this is a single
 * page rather than the list/detail pattern the other content types use — with
 * a fixed pair there is no list worth navigating.
 *
 * Every card posts under an `experts.<index>.` prefix, which is what makes the
 * server's zod issue paths line up with these inputs and mark the right
 * language tab on the right card.
 */
export function ExpertsForm({
  title,
  experts,
}: {
  title?: LocalizedValue | null;
  experts: ExpertValues[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    saveExperts,
    {},
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Card className="flex flex-col gap-5">
        <LocalizedField
          name="title"
          required={false}
          label="Заголовок секции"
          value={title ?? undefined}
          multiline
          rows={2}
          placeholder="Наши эксперты делятся принципами работы и подходом к производству"
          errors={errors}
          hint="Пусто — покажется заголовок из языковых файлов."
        />
      </Card>

      {experts.map((expert, index) => (
        <ExpertCard
          key={expert.id}
          expert={expert}
          index={index}
          errors={errors}
        />
      ))}

      <div className="flex items-center gap-3">
        <SubmitButton />
        <FormMessage state={state} />
      </div>
    </form>
  );
}

function ExpertCard({
  expert,
  index,
  errors,
}: {
  expert: ExpertValues;
  index: number;
  errors: Record<string, string>;
}) {
  const [photo, setPhoto] = useState<MediaRef | null>(expert.photo ?? null);
  const prefix = `experts.${index}`;

  return (
    <Card className="flex flex-col gap-5">
      {/* The id travels as a repeated field; the action reads them with
       * getAll("expertId") and uses the position to find the rest. */}
      <input type="hidden" name="expertId" value={expert.id} />
      <input type="hidden" name={`${prefix}.photoId`} value={photo?.id ?? ""} />

      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <h2 className="text-sm font-semibold text-ink">Эксперт {index + 1}</h2>
        <span className="text-xs text-ink-4">
          Карточек всегда две — добавить или удалить нельзя
        </span>
      </div>

      <MediaPicker
        label="Фотография"
        value={photo}
        onChange={setPhoto}
        hint="Квадратная фотография — карточка обрезает её до квадрата. Без фотографии карточка покажется без неё."
      />

      <LocalizedField
        name={`${prefix}.name`}
        required
        label="Имя"
        value={expert.name}
        placeholder="Мырадов Эзиз"
        errors={errors}
      />

      <LocalizedField
        name={`${prefix}.role`}
        required
        label="Должность"
        value={expert.role}
        placeholder="Начальник производственного цеха"
        errors={errors}
      />

      <RichLocalizedField
        name={`${prefix}.quote`}
        required
        label="Цитата"
        value={expert.quote}
        preset="quote"
        placeholder="«Каждое зерно, каждый профиль обжарки…»"
        errors={errors}
        hint="Кавычки-ёлочки набираются вручную — на сайте они не добавляются автоматически."
      />
    </Card>
  );
}
