"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title: string;
  /** The consequences. Kept as children so callers can itemize them. */
  children: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  tone?: "danger" | "neutral";
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Modal used for the two places in the admin where an action has consequences
 * the editor cannot see from the button they pressed: saving a product without
 * a photo, and deleting an image that other content still points at.
 *
 * Deliberately not a generic `confirm()` wrapper — both call sites need to list
 * *what* will change, which is the entire point of asking.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Отмена",
  pending = false,
  tone = "danger",
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", onKey);
    // Focus lands on the confirm button so the dialog is operable from the
    // keyboard the moment it opens.
    confirmRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => !pending && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-paper p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3">
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full",
              tone === "danger"
                ? "bg-danger/10 text-danger"
                : "bg-paper-alt text-ink-3",
            )}
          >
            <AlertTriangle className="h-4.5 w-4.5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <div className="flex flex-col gap-2 text-sm text-ink-2">
              {children}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-ink-2 transition-colors hover:bg-paper-alt hover:text-ink disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60",
              tone === "danger" ? "bg-danger" : "bg-paper-dark",
            )}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
