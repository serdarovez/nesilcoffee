"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import { deleteCountryContact } from "@/server/actions/country-contacts";

/**
 * Remove a branch office.
 *
 * Confirmed because it is not recoverable from the admin, and unremarkable
 * because it is not dangerous: the country simply falls back to head office,
 * which is what every other country already sees.
 */
export function DeleteOfficeButton({
  id,
  country,
}: {
  id: string;
  country: string;
}) {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setAsking(true)}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-xs text-ink-3 transition-colors hover:border-danger hover:bg-danger/5 hover:text-danger disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Удалить
      </button>

      <ConfirmDialog
        open={asking}
        title={`Удалить офис ${country}?`}
        confirmLabel="Удалить"
        onCancel={() => setAsking(false)}
        onConfirm={() => {
          setAsking(false);
          startTransition(() => void deleteCountryContact(id));
        }}
      >
        <p>
          Посетители из страны <strong className="font-semibold text-ink">{country}</strong>{" "}
          снова увидят адрес и телефоны из «Настроек».
        </p>
      </ConfirmDialog>
    </>
  );
}
