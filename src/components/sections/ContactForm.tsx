"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Check, AlertCircle, Mail } from "lucide-react";

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

/** WhatsApp mark — lucide has no brand icons, so it is inlined. */
function WhatsappGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
    </svg>
  );
}

export function ContactForm({
  whatsapp,
  contactEmail,
}: {
  /** Business WhatsApp number (digits only) and inbox, from site settings. */
  whatsapp?: string | null;
  contactEmail?: string | null;
}) {
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
    watch,
    getValues,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  /**
   * When the form became interactive — the server rejects fills faster than a
   * human could manage. Held in the form's own store rather than React state:
   * `Date.now()` is impure so it cannot run during render.
   */
  useEffect(() => {
    setValue("renderedAt", Date.now());
  }, [setValue]);

  /**
   * Record the enquiry. Always runs before the customer is handed off, so the
   * lead exists in the admin inbox even if they abandon WhatsApp or their mail
   * client without pressing send.
   */
  async function save(
    values: FormValues,
    channel: "FORM" | "WHATSAPP" | "EMAIL",
  ) {
    setStatus("sending");
    setErrorText(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale, channel }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorText(data?.error ?? null);
        throw new Error("Request failed");
      }
      setStatus("success");
      reset();
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }

  const onSubmit = (values: FormValues) => save(values, "FORM");

  // Live values so the handoff links always carry what is on screen.
  const values = watch();

  const body = [
    t("messageIntro"),
    "",
    `${t("name")}: ${values.name ?? ""}`,
    `${t("email")}: ${values.email ?? ""}`,
    `${t("subject")}: ${values.subject ?? ""}`,
    "",
    values.message ?? "",
  ].join("\n");

  const whatsappHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(body)}`
    : null;
  const mailtoHref = contactEmail
    ? `mailto:${contactEmail}?subject=${encodeURIComponent(
        values.subject || t("subject"),
      )}&body=${encodeURIComponent(body)}`
    : null;

  /**
   * The anchor already carries the href so the browser navigates natively;
   * a window.open() after an await would be swallowed by the popup blocker.
   * Validation is synchronous (safeParse) so preventDefault still applies.
   */
  function handleHandoff(channel: "WHATSAPP" | "EMAIL") {
    return (e: React.MouseEvent<HTMLAnchorElement>) => {
      const current = getValues();
      if (!schema.safeParse(current).success) {
        e.preventDefault();
        void trigger();
        return;
      }
      void save(current, channel);
    };
  }

  const hasHandoff = Boolean(whatsappHref || mailtoHref);

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

      {hasHandoff ? (
        <>
          <p className="mt-1 text-xs leading-[140%] text-[#777]">
            {t("sendHint")}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleHandoff("WHATSAPP")}
                className={cn(
                  "inline-flex py-3.5 flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 text-base font-medium text-white transition-opacity",
                  status === "sending" ? "cursor-wait opacity-70" : "hover:opacity-90",
                )}
              >
                <WhatsappGlyph className="h-5 w-5 shrink-0" />
                {t("sendWhatsapp")}
              </a>
            )}
            {mailtoHref && (
              <a
                href={mailtoHref}
                onClick={handleHandoff("EMAIL")}
                className={cn(
                  "inline-flex py-3.5 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1a1a1a] px-5 text-base font-medium text-white transition-colors",
                  status === "sending" ? "cursor-wait opacity-70" : "hover:bg-black",
                )}
              >
                <Mail className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                {t("sendEmail")}
              </a>
            )}
          </div>
        </>
      ) : (
        // Fallback when neither channel is set in site settings, so the form is
        // never a dead end.
        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-2 inline-flex py-3.5 items-center justify-center rounded-lg bg-[#1a1a1a] px-8 text-lg font-medium text-white transition-colors hover:bg-black disabled:opacity-60 cursor-pointer"
        >
          {status === "sending" ? t("sending") : t("send")}
        </button>
      )}

      <div className="mt-1 flex items-center gap-3">
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
