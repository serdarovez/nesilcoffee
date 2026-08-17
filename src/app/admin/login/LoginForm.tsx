"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

const FIELD =
  "w-full rounded-lg border border-line-strong bg-paper px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-lg bg-paper-dark px-8 text-base font-medium text-ink-inverse transition-colors hover:bg-brand-coffee disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Вход…" : "Войти"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">E-mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          placeholder="admin@nesilcoffee.com"
          className={FIELD}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">Пароль</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={FIELD}
        />
      </label>

      {state.error && (
        <p
          role="alert"
          className="inline-flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
