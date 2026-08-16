"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Minus, Plus, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { lenisRef } from "@/components/layout/SmoothScroll";

export type OrderProduct = {
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
}

export function OrderModal({ open, onClose, product }: OrderModalProps) {
  const t = useTranslations("products.orderModal");
  const [step, setStep] = useState<"form" | "success">("form");
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setSubmitting(true);
    try {
      // TODO: wire to /api/order or Resend. For now, simulate a network round-trip
      // so the button shows its sending state and users see visible feedback.
      await new Promise((r) => setTimeout(r, 700));
      setStep("success");
    } finally {
      setSubmitting(false);
    }
  }

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
                submitting={submitting}
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
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
};

function FormStep({
  t,
  product,
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
  submitting,
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

        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[#1a1a1a] px-8 py-3.5 text-base font-medium text-white transition-colors",
            submitting
              ? "cursor-wait opacity-70"
              : "hover:bg-[#2a1810]",
          )}
        >
          {submitting ? t("sending") : t("submit")}
        </button>
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
