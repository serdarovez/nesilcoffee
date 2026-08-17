"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, ChevronLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Layout                                                                    */
/* -------------------------------------------------------------------------- */

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10 md:py-10">
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-6 flex flex-col gap-3">
      {back && (
        <Link
          href={back.href}
          className="inline-flex w-fit items-center gap-1 text-sm text-ink-3 transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-tight text-ink">
            {title}
          </h1>
          {description && <p className="text-sm text-ink-3">{description}</p>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-paper-dark px-4 text-sm font-medium text-ink-inverse transition-colors hover:bg-brand-coffee"
          >
            <Plus className="h-4 w-4" />
            {action.label}
          </Link>
        )}
      </div>
    </header>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-paper p-5 md:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-paper py-14 text-center text-sm text-ink-4">
      {message}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Form primitives                                                           */
/* -------------------------------------------------------------------------- */

export const inputClass =
  "w-full rounded-lg border border-line-strong bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink disabled:bg-paper-alt disabled:text-ink-4";

export function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </span>
      {children}
      {hint && !error && <span className="text-xs text-ink-4">{hint}</span>}
      {error && (
        <span className="inline-flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </span>
      )}
    </label>
  );
}

export function SubmitButton({
  label = "Сохранить",
  pendingLabel = "Сохранение…",
}: {
  label?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-lg bg-paper-dark px-6 text-sm font-medium text-ink-inverse transition-colors hover:bg-brand-coffee disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function FormMessage({
  state,
}: {
  state: { ok?: boolean; error?: string };
}) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="inline-flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p className="inline-flex items-center gap-2 rounded-lg bg-success-tint px-3 py-2 text-sm text-success">
        <Check className="h-4 w-4 shrink-0" />
        Сохранено
      </p>
    );
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Status                                                                    */
/* -------------------------------------------------------------------------- */

export function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      title={active ? "Активен" : "Скрыт"}
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        active ? "bg-success" : "bg-ink-5",
      )}
    />
  );
}

export function LocaleBadges({
  filled,
  all,
}: {
  filled: string[];
  all: readonly string[];
}) {
  return (
    <span className="inline-flex gap-1">
      {all.map((locale) => (
        <span
          key={locale}
          title={
            filled.includes(locale)
              ? `${locale.toUpperCase()} заполнен`
              : `${locale.toUpperCase()} не заполнен — покажется русская версия`
          }
          className={cn(
            "rounded px-1 text-[10px] font-semibold uppercase leading-4",
            filled.includes(locale)
              ? "bg-paper-dark text-ink-inverse"
              : "bg-paper-alt text-ink-5",
          )}
        >
          {locale}
        </span>
      ))}
    </span>
  );
}
