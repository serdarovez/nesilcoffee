"use client";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Mail, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The short "Have questions?" block, shown on the home, products and about
 * pages. It asks only for an email and a message; the server fills in a name
 * and subject so the admin inbox still has something readable.
 */
export function CTAContact() {
  const t = useTranslations("home.cta");
  const form = useTranslations("form");
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [errorText, setErrorText] = useState<string | null>(null);

  /** Stamped after mount — `Date.now()` is impure and must not run in render. */
  const renderedAt = useRef(0);
  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setErrorText(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          message: text,
          locale,
          website: honeypot,
          renderedAt: renderedAt.current,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorText(data?.error ?? null);
        setStatus("error");
        return;
      }
      setStatus("success");
      setEmail("");
      setText("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="container-x section-y">
      {/* Horizontal padding was clamp(32px,5vw,80px) — up to 80px, which on a
        * wide screen pushed "У вас есть вопросы?" a long way inside the card
        * while every other section heading starts on the site gutter, so this
        * one read as misaligned rather than inset. Halved, and kept symmetric
        * so the form on the right stays balanced against it. */}
      <div className="surface-card flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between md:gap-[clamp(24px,4vw,72px)] md:px-[clamp(24px,2.5vw,40px)] md:py-[clamp(40px,7svh,84px)]">
        <h2 className="display-1 text-ink md:min-w-0 md:flex-1">{t("title")}</h2>

        <div className="flex flex-col gap-4 md:min-w-0 md:flex-1">
          <p className="body-md text-ink">{t("body")}</p>

          <form onSubmit={onSubmit} className="flex w-full flex-col gap-2">
            <label className="relative flex items-center rounded-lg bg-paper px-4 py-3.5 md:py-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={form("email")}
                className="body-md w-full bg-transparent text-ink placeholder:text-ink-placeholder outline-none"
              />
              <Mail className="h-5 w-5 shrink-0 text-ink-placeholder md:h-6 md:w-6" />
            </label>

            <label className="relative flex items-start rounded-lg bg-paper px-4 py-3.5 md:py-4">
              <textarea
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={form("message")}
                rows={3}
                className="body-md w-full resize-none bg-transparent text-ink placeholder:text-ink-placeholder outline-none"
              />
              <Mail className="h-5 w-5 shrink-0 text-ink-placeholder opacity-0 md:h-6 md:w-6" />
            </label>

            {/* Honeypot — off-screen rather than display:none, because some bots
             * skip hidden fields but fill positioned ones. */}
            <div
              aria-hidden
              className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden"
            >
              <label>
                Website
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className={cn(
                "body-md mt-1 inline-flex w-full items-center justify-center rounded-lg bg-ink-3 px-8 py-3.5 font-medium text-ink-inverse-2 transition-colors hover:bg-paper-dark hover:text-ink-inverse md:mt-0 md:w-[clamp(180px,15vw,210px)] md:py-4",
                status === "sending" && "cursor-wait opacity-70",
              )}
            >
              {status === "sending" ? form("sending") : form("send")}
            </button>

            {status === "success" && (
              <span className="inline-flex items-center gap-2 text-sm text-success">
                <Check className="h-4 w-4 shrink-0" />
                {form("success")}
              </span>
            )}
            {status === "error" && (
              <span
                role="alert"
                className="inline-flex items-start gap-2 text-sm text-danger"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {errorText ?? form("error")}
              </span>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
