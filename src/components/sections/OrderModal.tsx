"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Minus, Plus, Check, Mail } from "lucide-react";

/** WhatsApp mark — lucide has no brand icons, so it is inlined. */
function WhatsappGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
    </svg>
  );
}
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { lenisRef } from "@/components/layout/SmoothScroll";

export type OrderProduct = {
  /** Database id, so the submission can be linked to the product. */
  id?: string;
  name: string;
  image: string;
  category: string;
  weight: string;
  description: string;
};

interface OrderModalProps {
  open: boolean;
  onClose: () => void;
  product: OrderProduct | null;
  /** Business WhatsApp number (digits only) and inbox, from site settings. */
  whatsapp?: string | null;
  email?: string | null;
}

/**
 * The plain-text order summary handed to WhatsApp or the mail client.
 * Kept identical between channels so the business always sees the same shape.
 */
function buildMessage(
  product: OrderProduct,
  fields: { qty: number; name: string; phone: string; email: string; comment: string },
  labels: { intro: string; product: string; category: string; weight: string; qty: string; name: string; phone: string; email: string; comment: string },
): string {
  const lines = [
    labels.intro,
    "",
    `${labels.product}: ${product.name}`,
    `${labels.category}: ${product.category}`,
    `${labels.weight}: ${product.weight}`,
    `${labels.qty}: ${fields.qty}`,
    "",
    `${labels.name}: ${fields.name}`,
  ];
  if (fields.phone) lines.push(`${labels.phone}: ${fields.phone}`);
  if (fields.email) lines.push(`${labels.email}: ${fields.email}`);
  if (fields.comment) lines.push("", `${labels.comment}: ${fields.comment}`);
  return lines.join("\n");
}

export function OrderModal({
  open,
  onClose,
  product,
  whatsapp,
  email: businessEmail,
}: OrderModalProps) {
  const t = useTranslations("products.orderModal");
  const locale = useLocale();
  const [step, setStep] = useState<"form" | "success">("form");
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  /**
   * When the form became visible — the server rejects fills faster than a human
   * could manage. Stamped in an effect rather than a `useRef` initialiser
   * because `Date.now()` is impure and must not run during render.
   */
  const renderedAt = useRef<number>(0);

  // Lock page scroll while open. Lenis intercepts wheel events with its own
  // RAF loop, so setting overflow:hidden alone isn't enough — Lenis has to
  // be paused explicitly. Body scrollbar hidden to prevent layout shift.
  useEffect(() => {
    if (!open) return;
    const lenis = lenisRef.current;
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      lenis?.start();
    };
  }, [open]);

  // Whenever the modal is (re)opened, jump the panel back to the top so the
  // header ("Оформить заказ") is always the first thing users see.
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [open, step]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset form state when the modal opens fresh
  useEffect(() => {
    if (open) {
      setStep("form");
      setQty(1);
      setName("");
      setPhone("");
      setEmail("");
      setComment("");
      setHoneypot("");
      setError(null);
      renderedAt.current = Date.now();
    }
  }, [open]);

  /**
   * Record the enquiry. Always runs before the customer is handed off, so the
   * lead exists in the admin inbox even if they abandon WhatsApp or their mail
   * client without pressing send.
   */
  async function save(channel: "FORM" | "WHATSAPP" | "EMAIL") {
    if (!product) return false;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          comment,
          quantity: qty,
          productId: product.id,
          productName: product.name,
          locale,
          channel,
          // Spam guards: `website` is the hidden honeypot, `renderedAt` lets
          // the server reject submissions filled faster than a human could.
          website: honeypot,
          renderedAt: renderedAt.current,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? t("error"));
        return false;
      }
      return true;
    } catch {
      setError(t("error"));
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (await save("FORM")) setStep("success");
  }

  /**
   * Handoff click. The href is already on the anchor, so the browser navigates
   * natively — calling window.open() after an await would be swallowed by the
   * popup blocker. The save is fired without blocking that navigation, and the
   * success screen follows once it resolves.
   */
  function handleHandoff(channel: "WHATSAPP" | "EMAIL") {
    return (e: React.MouseEvent<HTMLAnchorElement>) => {
      const form = e.currentTarget.closest("form");
      if (form && !form.reportValidity()) {
        e.preventDefault();
        return;
      }
      void save(channel).then((ok) => {
        if (ok) setStep("success");
      });
    };
  }

  // Recomputed on every keystroke so the link always carries what is on screen.
  const messageBody = product
    ? buildMessage(
        product,
        { qty, name, phone, email, comment },
        {
          intro: t("messageIntro"),
          product: t("messageProduct"),
          category: t("messageCategory"),
          weight: t("messageWeight"),
          qty: t("quantity"),
          name: t("name"),
          phone: t("phone"),
          email: t("email"),
          comment: t("comment"),
        },
      )
    : "";

  const whatsappHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(messageBody)}`
    : null;

  const mailtoHref = businessEmail
    ? `mailto:${businessEmail}?subject=${encodeURIComponent(
        `${t("title")}: ${product?.name ?? ""}${qty > 1 ? ` x ${qty}` : ""}`,
      )}&body=${encodeURIComponent(messageBody)}`
    : null;

  return (
    <AnimatePresence>
      {open && product && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-6 md:items-center md:py-10"
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            key="panel"
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto flex w-full max-w-md flex-col rounded-3xl bg-white p-6 shadow-2xl md:p-7"
          >
            {step === "form" ? (
              <FormStep
                t={t}
                product={product}
                whatsappHref={whatsappHref}
                mailtoHref={mailtoHref}
                onHandoff={handleHandoff}
                qty={qty}
                setQty={setQty}
                name={name}
                setName={setName}
                phone={phone}
                setPhone={setPhone}
                email={email}
                setEmail={setEmail}
                comment={comment}
                setComment={setComment}
                honeypot={honeypot}
                setHoneypot={setHoneypot}
                submitting={submitting}
                error={error}
                onSubmit={handleSubmit}
                onClose={onClose}
              />
            ) : (
              <SuccessStep t={t} onClose={onClose} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type FormStepProps = {
  t: ReturnType<typeof useTranslations>;
  product: OrderProduct;
  whatsappHref: string | null;
  mailtoHref: string | null;
  onHandoff: (
    channel: "WHATSAPP" | "EMAIL",
  ) => (e: React.MouseEvent<HTMLAnchorElement>) => void;
  qty: number;
  setQty: (n: number) => void;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  comment: string;
  setComment: (v: string) => void;
  honeypot: string;
  setHoneypot: (v: string) => void;
  submitting: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
};

function FormStep({
  t,
  product,
  whatsappHref,
  mailtoHref,
  onHandoff,
  qty,
  setQty,
  name,
  setName,
  phone,
  setPhone,
  email,
  setEmail,
  comment,
  setComment,
  honeypot,
  setHoneypot,
  submitting,
  error,
  onSubmit,
  onClose,
}: FormStepProps) {
  return (
    <>
      <header className="flex items-start justify-between gap-4 pb-4">
        <h2 className="font-display text-2xl font-extrabold uppercase text-[#1a1a1a] leading-[100%] md:text-3xl">
          {t("title")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#1a1a1a] transition-colors hover:bg-[#f2f0eb]"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </header>

      {/* Product summary card */}
      <div className="mb-5 flex gap-3 rounded-2xl bg-[#f5f5f5] p-3">
        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="80px"
            className="object-contain"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <h3 className="font-display text-xl font-extrabold uppercase text-[#1a1a1a] leading-[100%]">
            {product.name}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-full border border-[#d9d9d9] bg-white px-2.5 py-1 text-xs font-medium text-[#1a1a1a]">
              {product.category}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#d9d9d9] bg-white px-2.5 py-1 text-xs font-medium text-[#1a1a1a]">
              {product.weight}
            </span>
          </div>
          <p className="text-xs leading-[140%] text-[#444444]">
            {product.description}
          </p>
          <div className="mt-1 flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#1a1a1a]">
              {t("quantity")}
            </span>
            <div className="flex items-center gap-2">
              <QtyButton
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
                aria-label="Decrease"
              >
                <Minus className="h-4 w-4" />
              </QtyButton>
              <span className="w-6 text-center text-base font-bold text-[#1a1a1a]">
                {qty}
              </span>
              <QtyButton
                onClick={() => setQty(qty + 1)}
                aria-label="Increase"
              >
                <Plus className="h-4 w-4" />
              </QtyButton>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label={t("name")} required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={t("namePlaceholder")}
            className="w-full rounded-full border border-[#d9d9d9] bg-white px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
          />
        </Field>
        <Field label={t("phone")}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("phonePlaceholder")}
            className="w-full rounded-full border border-[#d9d9d9] bg-white px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
          />
        </Field>
        <Field label={t("email")} required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t("emailPlaceholder")}
            className="w-full rounded-full border border-[#d9d9d9] bg-white px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
          />
        </Field>
        <Field label={t("comment")}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("commentPlaceholder")}
            rows={3}
            className="w-full resize-none rounded-2xl border border-[#d9d9d9] bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]"
          />
        </Field>

        {/* Honeypot: positioned off-screen rather than display:none, because
         * some bots skip hidden fields but fill positioned ones. Real users
         * never reach it — it is aria-hidden and outside the tab order. */}
        <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
        </div>

        {error && (
          <p
            role="alert"
            className="inline-flex items-start gap-2 rounded-lg bg-[#fdecec] px-3 py-2 text-sm text-[#c0392b]"
          >
            {error}
          </p>
        )}

        <p className="mt-1 text-center text-xs leading-[140%] text-[#777]">
          {t("sendHint")}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onHandoff("WHATSAPP")}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2.5 text-sm font-medium leading-none text-white transition-opacity",
                submitting ? "cursor-wait opacity-70" : "hover:opacity-90",
              )}
            >
              <WhatsappGlyph className="h-4 w-4 shrink-0" />
              {t("sendWhatsapp")}
            </a>
          )}

          {mailtoHref && (
            <a
              href={mailtoHref}
              onClick={onHandoff("EMAIL")}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1a1a1a] px-3 py-2.5 text-sm font-medium leading-none text-white transition-colors",
                submitting ? "cursor-wait opacity-70" : "hover:bg-[#2a1810]",
              )}
            >
              <Mail className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {t("sendEmail")}
            </a>
          )}
        </div>

        {/* Fallback when neither channel is configured in site settings, so the
         * modal is never a dead end. */}
        {!whatsappHref && !mailtoHref && (
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              // Same scale as the WhatsApp/email pair it stands in for.
              "mt-2 inline-flex w-full items-center justify-center rounded-lg bg-[#1a1a1a] px-8 py-2.5 text-sm font-medium leading-none text-white transition-colors",
              submitting ? "cursor-wait opacity-70" : "hover:bg-[#2a1810]",
            )}
          >
            {submitting ? t("sending") : t("submit")}
          </button>
        )}
      </form>
    </>
  );
}

function SuccessStep({
  t,
  onClose,
}: {
  t: ReturnType<typeof useTranslations>;
  onClose: () => void;
}) {
  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="-mr-1 grid h-9 w-9 place-items-center rounded-full text-[#1a1a1a] transition-colors hover:bg-[#f2f0eb]"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>
      <div className="flex flex-col items-center gap-5 px-2 pb-6 pt-2 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[#dcf5e0]">
          <Check className="h-8 w-8 text-[#1fa044]" strokeWidth={3} />
        </div>
        <h2 className="font-display text-2xl font-extrabold uppercase text-[#1a1a1a] leading-[100%]">
          {t("successTitle")}
        </h2>
        <p className="text-sm leading-[140%] text-[#444444]">
          {t("successBody")}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[#1a1a1a] px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-[#2a1810]"
        >
          {t("close")}
        </button>
      </div>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-[#1a1a1a]">
        {label}
        {required && <span className="ml-1 text-[#ef4444]">*</span>}
      </span>
      {children}
    </label>
  );
}

function QtyButton({
  children,
  onClick,
  disabled,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "disabled" | "children">) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full border border-[#d9d9d9] bg-white text-[#1a1a1a] transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:border-[#1a1a1a]",
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
