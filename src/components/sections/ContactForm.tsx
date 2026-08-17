"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Check, AlertCircle } from "lucide-react";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
  /** Hidden honeypot — only bots fill it in. */
  website: z.string().optional(),
  /** Stamped on mount; the server rejects impossibly fast fills. */
  renderedAt: z.number().optional(),
});

type FormValues = z.infer<typeof schema>;

const fieldClass =
  "w-full rounded-lg bg-white px-4 py-3.5 text-base text-[#1a1a1a] placeholder:text-[#999ead] outline-none transition-colors focus:ring-2 focus:ring-[#191919]/30";

export function ContactForm() {
  const t = useTranslations("form");
  const locale = useLocale();
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  /**
   * When the form became interactive — the server rejects fills faster than a
   * human could manage.
   *
   * Held in the form itself rather than React state: `Date.now()` is impure so
   * it cannot run during render, and React state would mean a setState inside
   * an effect. `setValue` writes to react-hook-form's own store, so neither
   * applies.
   */
  useEffect(() => {
    setValue("renderedAt", Date.now());
  }, [setValue]);

  const onSubmit = async (values: FormValues) => {
    setStatus("sending");
    setErrorText(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorText(data?.error ?? null);
        throw new Error("Request failed");
      }
      setStatus("success");
      reset();
      // No need to re-stamp for a second message: the form has necessarily
      // been open longer than the minimum fill time by now, and the per-IP
      // rate limit is what actually guards against repeat submissions.
    } catch {
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-2"
      noValidate
    >
      <input
        {...register("name")}
        placeholder={t("name")}
        aria-invalid={!!errors.name}
        className={cn(fieldClass, errors.name && "ring-2 ring-red-400/50")}
      />
      <input
        type="email"
        {...register("email")}
        placeholder={t("email")}
        aria-invalid={!!errors.email}
        className={cn(fieldClass, errors.email && "ring-2 ring-red-400/50")}
      />
      <input
        {...register("subject")}
        placeholder={t("subject")}
        aria-invalid={!!errors.subject}
        className={cn(fieldClass, errors.subject && "ring-2 ring-red-400/50")}
      />
      <textarea
        {...register("message")}
        placeholder={t("message")}
        rows={4}
        aria-invalid={!!errors.message}
        className={cn(
          fieldClass,
          "resize-none",
          errors.message && "ring-2 ring-red-400/50",
        )}
      />

      {/* Honeypot — off-screen rather than display:none, because some bots
       * skip hidden fields but fill positioned ones. aria-hidden and out of
       * the tab order, so no real user encounters it. */}
      <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex h-13 items-center justify-center rounded-lg bg-[#1a1a1a] px-8 text-lg font-medium text-white transition-colors hover:bg-black disabled:opacity-60 cursor-pointer"
        >
          {status === "sending" ? t("sending") : t("send")}
        </button>
        {status === "success" && (
          <span className="inline-flex items-center gap-2 text-sm text-emerald-600">
            <Check className="h-4 w-4" />
            {t("success")}
          </span>
        )}
        {status === "error" && (
          <span className="inline-flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {errorText ?? t("error")}
          </span>
        )}
      </div>
    </form>
  );
}
