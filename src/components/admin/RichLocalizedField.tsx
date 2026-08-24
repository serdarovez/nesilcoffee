"use client";

import { useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import {
  AlertCircle,
  Bold,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Strikethrough,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";
import { LOCALE_ORDER, type LocalizedField as LocalizedValue } from "@/lib/i18n-field";
import { isBlankRichText } from "@/lib/rich-text";

const LABELS: Record<string, string> = {
  ru: "RU",
  en: "EN",
  tk: "TK",
  uz: "UZ",
  az: "AZ",
};

/**
 * How much formatting a field offers.
 *
 *  - `quote` — a pull quote. Emphasis and line breaks only; lists and links
 *    would be wrong in a one-paragraph testimonial, and leaving the buttons
 *    off is more honest than allowing them and asking editors not to.
 *  - `rich`  — prose. Adds lists and links, which FAQ answers genuinely need.
 *
 * Both are enforced by the ProseMirror schema, not just the toolbar: with
 * `bulletList: false` a pasted list is flattened to paragraphs on the way in.
 */
export type RichTextPreset = "quote" | "rich";

type Props = {
  /** Form field prefix; inputs are named `<name>.<locale>`. */
  name: string;
  label: string;
  /** Whether the schema behind this field uses `localizedRequired`. */
  required: boolean;
  value?: LocalizedValue | null;
  preset?: RichTextPreset;
  placeholder?: string;
  hint?: string;
  /** Keyed by `<name>.<locale>` or `<name>`. */
  errors?: Record<string, string>;
};

/**
 * Editor for a translatable rich-text field.
 *
 * Structurally the same as `LocalizedField` — one hidden input per locale, all
 * five always in the DOM, so the whole field submits in one request — but the
 * visible control is a Tiptap editor.
 *
 * Only the active locale's editor is mounted. Mounting five ProseMirror
 * instances per field would cost five editor states for four documents nobody
 * is looking at; the drafts live in React state either way, and the hidden
 * inputs are what actually get submitted.
 */
export function RichLocalizedField({
  name,
  label,
  required,
  value,
  preset = "rich",
  placeholder,
  hint,
  errors,
}: Props) {
  const [active, setActive] = useState<string>(routing.defaultLocale);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(LOCALE_ORDER.map((l) => [l, value?.[l] ?? ""])),
  );

  const localeErrors = Object.fromEntries(
    LOCALE_ORDER.map((l) => [l, errors?.[`${name}.${l}`]]),
  ) as Record<string, string | undefined>;
  const fieldError = errors?.[name] ?? localeErrors[active];
  const missingLocales = LOCALE_ORDER.filter((l) => localeErrors[l]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">
          {label}
          {required ? (
            <span className="ml-1 text-xs font-normal text-danger">
              * все языки
            </span>
          ) : (
            <span className="ml-1.5 text-xs font-normal text-ink-4">
              необязательно
            </span>
          )}
        </span>

        <div className="flex gap-1" role="tablist" aria-label={`${label}: язык`}>
          {LOCALE_ORDER.map((locale) => {
            const filled = !isBlankRichText(draft[locale] ?? "");
            const isDefault = locale === routing.defaultLocale;
            return (
              <button
                key={locale}
                type="button"
                role="tab"
                aria-selected={active === locale}
                onClick={() => setActive(locale)}
                title={
                  required
                    ? filled
                      ? "Заполнено"
                      : "Обязательный язык — заполните"
                    : isDefault
                      ? "Основной язык"
                      : filled
                        ? "Заполнено"
                        : "Пусто — покажется русская версия"
                }
                className={cn(
                  "relative rounded-md px-2 py-1 text-xs font-semibold transition-colors",
                  active === locale
                    ? "bg-paper-dark text-ink-inverse"
                    : localeErrors[locale]
                      ? "bg-danger/10 text-danger"
                      : "bg-paper-alt text-ink-3 hover:text-ink",
                )}
              >
                {LABELS[locale] ?? locale.toUpperCase()}
                {required && !filled && <span className="ml-0.5 text-danger">*</span>}
                {!required && !filled && !isDefault && (
                  <span className="ml-1 text-ink-5">·</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Every locale submits, including the four that are not on screen. */}
      {LOCALE_ORDER.map((locale) => (
        <input
          key={locale}
          type="hidden"
          name={`${name}.${locale}`}
          value={draft[locale] ?? ""}
        />
      ))}

      {/* Keyed by locale so switching tabs remounts the editor with that
       * locale's document — Tiptap does not adopt a changed `content` prop. */}
      <RichTextEditor
        key={active}
        preset={preset}
        invalid={Boolean(fieldError)}
        initialHtml={draft[active] ?? ""}
        placeholder={
          active === routing.defaultLocale
            ? placeholder
            : required
              ? "Перевод обязателен"
              : "Оставьте пустым — покажется русская версия"
        }
        onChange={(html) => setDraft((d) => ({ ...d, [active]: html }))}
      />

      {hint && !fieldError && missingLocales.length === 0 && (
        <span className="text-xs text-ink-4">{hint}</span>
      )}
      {fieldError && (
        <span className="inline-flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {fieldError}
        </span>
      )}
      {missingLocales.length > 0 && (
        <span className="text-xs text-danger">
          Не заполнено:{" "}
          {missingLocales.map((l) => LABELS[l] ?? l.toUpperCase()).join(", ")}
        </span>
      )}
    </div>
  );
}

function RichTextEditor({
  initialHtml,
  onChange,
  preset,
  placeholder,
  invalid,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  preset: RichTextPreset;
  placeholder?: string;
  invalid: boolean;
}) {
  const lists = preset === "rich";

  const editor = useEditor({
    // Required under the App Router: rendering the editor during SSR produces
    // markup React then disagrees with on hydration.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Off in both presets — none of these belong in a product FAQ answer
        // or a pull quote, and every tag they emit is outside the sanitizer's
        // allowlist, so they would be stripped on save anyway.
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        // Preset-dependent. `false` removes them from the schema, so pasted
        // markup is flattened rather than silently dropped later.
        bulletList: lists ? undefined : false,
        orderedList: lists ? undefined : false,
        listItem: lists ? undefined : false,
        link: lists
          ? { openOnClick: false, autolink: true, protocols: ["http", "https", "mailto", "tel"] }
          : false,
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: initialHtml,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "rich-text px-3 py-2.5 text-sm text-ink",
      },
    },
  });

  return (
    <div
      className={cn(
        "rich-text-editor overflow-hidden rounded-lg border bg-paper transition-colors focus-within:border-ink",
        invalid ? "border-danger" : "border-line-strong",
      )}
    >
      <Toolbar editor={editor} lists={lists} />
      <EditorContent editor={editor} />
    </div>
  );
}

const TOOL_BTN =
  "grid h-7 w-7 place-items-center rounded transition-colors disabled:opacity-30";

function Toolbar({ editor, lists }: { editor: Editor | null; lists: boolean }) {
  if (!editor) {
    // Reserve the row so the field does not jump when the editor mounts.
    return <div className="h-9 border-b border-line bg-paper-alt" />;
  }

  return (
    <div className="flex items-center gap-0.5 border-b border-line bg-paper-alt px-1.5 py-1">
      <Tool
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Полужирный"
        icon={Bold}
      />
      <Tool
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Курсив"
        icon={Italic}
      />
      <Tool
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Зачёркнутый"
        icon={Strikethrough}
      />

      {lists && (
        <>
          <span className="mx-1 h-4 w-px bg-line-strong" />
          <Tool
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Маркированный список"
            icon={List}
          />
          <Tool
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Нумерованный список"
            icon={ListOrdered}
          />
          <span className="mx-1 h-4 w-px bg-line-strong" />
          <LinkTool editor={editor} />
        </>
      )}
    </div>
  );
}

function Tool({
  active,
  onClick,
  title,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        TOOL_BTN,
        active
          ? "bg-paper-dark text-ink-inverse"
          : "text-ink-3 hover:bg-paper hover:text-ink",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/**
 * Link add/remove.
 *
 * `window.prompt` rather than a custom popover: this is one field in an admin
 * panel used by two people, and a bespoke link dialog is a surprising amount of
 * focus-management work for it. Blank input removes the link, which is the
 * conventional behaviour.
 */
function LinkTool({ editor }: { editor: Editor }) {
  const linked = editor.isActive("link");

  const edit = () => {
    const current = (editor.getAttributes("link").href as string) ?? "";
    const next = window.prompt("Адрес ссылки (пусто — убрать)", current);
    if (next === null) return;

    const href = next.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href })
      .run();
  };

  return (
    <button
      type="button"
      onClick={edit}
      title={linked ? "Изменить или убрать ссылку" : "Вставить ссылку"}
      aria-label={linked ? "Изменить ссылку" : "Вставить ссылку"}
      aria-pressed={linked}
      className={cn(
        TOOL_BTN,
        linked
          ? "bg-paper-dark text-ink-inverse"
          : "text-ink-3 hover:bg-paper hover:text-ink",
      )}
    >
      {linked ? (
        <Link2Off className="h-3.5 w-3.5" />
      ) : (
        <Link2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
