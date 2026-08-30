"use client";

import { useActionState, useState } from "react";
import { LocalizedField } from "./LocalizedField";
import { RichLocalizedField } from "./RichLocalizedField";
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
import {
  CATEGORY_RULE_FIELDS,
  FIELD_MODES,
  FIELD_MODE_LABEL,
  DEFAULT_FIELD_RULES,
  type CategoryFieldRules,
} from "@/lib/category-fields";

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
    fieldRules?: CategoryFieldRules;
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
          required
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
      <FieldRulesCard rules={values.fieldRules ?? DEFAULT_FIELD_RULES} />
      <ActiveToggle defaultChecked={values.isActive ?? true} />
      <Footer state={state} />
    </form>
  );
}

/**
 * Per-category product-field rules.
 *
 * Radios rather than dropdowns: with a handful of fields and three states the
 * whole matrix is readable at a glance, which is the point — the question an
 * editor is answering is "what does a product in this category look like", and
 * that is easier to judge as a grid than as a column of selects.
 *
 * Switching a field to «Нет» never deletes anything. Values already stored stay
 * in the database and come back if the rule is switched on again — see
 * `specWrite` in src/server/actions/products.ts.
 */
function FieldRulesCard({ rules }: { rules: CategoryFieldRules }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-semibold text-ink">Поля товара</h2>
        <p className="text-xs text-ink-4">
          Что заполняется у товаров этой категории. «Нет» — поле не
          используется: оно скрыто в форме товара и не показывается на сайте.
          Уже введённые значения при этом сохраняются.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-line">
        {CATEGORY_RULE_FIELDS.map((field) => (
          <div
            key={field.key}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="flex min-w-0 flex-col">
              <span className="text-sm text-ink">{field.label}</span>
              {field.hint && (
                <span className="text-xs text-ink-4">{field.hint}</span>
              )}
            </span>
            <span className="flex shrink-0 gap-1">
              {FIELD_MODES.map((mode) => (
                <label
                  key={mode}
                  className="cursor-pointer select-none rounded-md border border-line-strong px-2.5 py-1 text-xs text-ink-3 transition-colors has-checked:border-ink has-checked:bg-paper-dark has-checked:text-ink-inverse hover:border-ink-4"
                >
                  <input
                    type="radio"
                    name={`fieldRules.${field.key}`}
                    value={mode}
                    defaultChecked={rules[field.key] === mode}
                    className="sr-only"
                  />
                  {FIELD_MODE_LABEL[mode]}
                </label>
              ))}
            </span>
          </div>
        ))}
      </div>
    </Card>
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
          cropAspect={1}
          hint="После выбора файла можно подвинуть и приблизить фото — на сайте покажется ровно то, что попало в рамку."
        />
        <LocalizedField
          name="name"
          required
          label="Имя"
          value={values.name}
          placeholder="Аделя Сахбиева"
          errors={errors}
        />
        <LocalizedField
          name="role"
          required
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
          required
          label="Вопрос"
          value={values.question}
          placeholder="Какой минимальный объём заказа?"
          errors={errors}
        />
        <RichLocalizedField
          name="answer"
          required
          label="Ответ"
          value={values.answer}
          preset="rich"
          errors={errors}
          hint="Можно выделять текст, делать списки и ставить ссылки."
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
          required
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
          required
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
