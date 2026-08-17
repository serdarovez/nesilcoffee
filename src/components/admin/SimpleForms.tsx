"use client";

import { useActionState, useState } from "react";
import { LocalizedField } from "./LocalizedField";
import { MediaPicker, type MediaRef } from "./MediaPicker";
import { Card, Field, FormMessage, SubmitButton, inputClass } from "./ui";
import { saveCategory } from "@/server/actions/categories";
import {
  saveTeamMember,
  saveFaqItem,
  saveCertificate,
} from "@/server/actions/content";
import type { FormState } from "@/server/form";
import type { LocalizedField as LocalizedValue } from "@/lib/i18n-field";

/** Shared "visible on the site" switch — identical across every entity. */
function ActiveToggle({ defaultChecked }: { defaultChecked: boolean }) {
  return (
    <Card>
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={defaultChecked}
          className="h-4 w-4 accent-[#191919]"
        />
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-ink">Показывать на сайте</span>
          <span className="text-xs text-ink-4">
            Снимите галочку, чтобы временно скрыть, не удаляя
          </span>
        </span>
      </label>
    </Card>
  );
}

function Footer({ state }: { state: FormState }) {
  return (
    <div className="flex items-center gap-3">
      <SubmitButton />
      <FormMessage state={state} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function CategoryForm({
  values,
}: {
  values: {
    id?: string;
    name?: LocalizedValue;
    slug?: string;
    isActive?: boolean;
  };
}) {
  const [state, formAction] = useActionState<FormState, FormData>(saveCategory, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Card className="flex flex-col gap-5">
        <LocalizedField
          name="name"
          label="Название категории"
          value={values.name}
          placeholder="Зерновой кофе"
          errors={errors}
          hint="Показывается заголовком над сеткой товаров на странице продукции."
        />
        <Field
          label="Адрес (slug)"
          error={errors.slug}
          hint="Оставьте пустым — создастся из названия"
        >
          <input
            name="slug"
            defaultValue={values.slug ?? ""}
            placeholder="bean"
            className={inputClass}
          />
        </Field>
      </Card>
      <ActiveToggle defaultChecked={values.isActive ?? true} />
      <Footer state={state} />
    </form>
  );
}

/* -------------------------------------------------------------------------- */

export function TeamForm({
  values,
}: {
  values: {
    id?: string;
    name?: LocalizedValue;
    role?: LocalizedValue;
    phone?: string | null;
    email?: string | null;
    avatar?: MediaRef | null;
    isActive?: boolean;
  };
}) {
  const [state, formAction] = useActionState<FormState, FormData>(saveTeamMember, {});
  const [avatar, setAvatar] = useState<MediaRef | null>(values.avatar ?? null);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="avatarId" value={avatar?.id ?? ""} />

      <Card className="flex flex-col gap-5">
        <MediaPicker
          label="Фотография"
          value={avatar}
          onChange={setAvatar}
          hint="Квадратная фотография — карточка обрезает её до квадрата."
        />
        <LocalizedField
          name="name"
          label="Имя"
          value={values.name}
          placeholder="Аделя Сахбиева"
          errors={errors}
        />
        <LocalizedField
          name="role"
          label="Должность"
          value={values.role}
          placeholder="Ведущий специалист по экспорту"
          errors={errors}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Телефон" error={errors.phone}>
            <input
              name="phone"
              defaultValue={values.phone ?? ""}
              placeholder="+993 64 83 42 8"
              className={inputClass}
            />
          </Field>
          <Field label="E-mail" error={errors.email}>
            <input
              name="email"
              type="email"
              defaultValue={values.email ?? ""}
              placeholder="info@nesilcoffee.com"
              className={inputClass}
            />
          </Field>
        </div>
      </Card>
      <ActiveToggle defaultChecked={values.isActive ?? true} />
      <Footer state={state} />
    </form>
  );
}

/* -------------------------------------------------------------------------- */

export function FaqForm({
  values,
}: {
  values: {
    id?: string;
    question?: LocalizedValue;
    answer?: LocalizedValue;
    isActive?: boolean;
  };
}) {
  const [state, formAction] = useActionState<FormState, FormData>(saveFaqItem, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Card className="flex flex-col gap-5">
        <LocalizedField
          name="question"
          label="Вопрос"
          value={values.question}
          placeholder="Какой минимальный объём заказа?"
          errors={errors}
        />
        <LocalizedField
          name="answer"
          label="Ответ"
          value={values.answer}
          multiline
          rows={5}
          errors={errors}
        />
      </Card>
      <ActiveToggle defaultChecked={values.isActive ?? true} />
      <Footer state={state} />
    </form>
  );
}

/* -------------------------------------------------------------------------- */

export function CertificateForm({
  values,
}: {
  values: {
    id?: string;
    name?: LocalizedValue;
    description?: LocalizedValue;
    image?: MediaRef | null;
    isActive?: boolean;
  };
}) {
  const [state, formAction] = useActionState<FormState, FormData>(saveCertificate, {});
  const [image, setImage] = useState<MediaRef | null>(values.image ?? null);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="imageId" value={image?.id ?? ""} />
      <Card className="flex flex-col gap-5">
        <MediaPicker
          label="Изображение сертификата"
          value={image}
          onChange={setImage}
          hint="Вертикальное изображение, примерно 235×332."
        />
        <LocalizedField
          name="name"
          label="Название"
          value={values.name}
          multiline
          rows={2}
          placeholder="ISO 9001:2015 и ISO 22000:2018"
          errors={errors}
          hint="Перенос строки в поле сохраняется и на сайте."
        />
        <LocalizedField
          name="description"
          label="Описание"
          value={values.description}
          multiline
          rows={4}
          errors={errors}
        />
      </Card>
      <ActiveToggle defaultChecked={values.isActive ?? true} />
      <Footer state={state} />
    </form>
  );
}
