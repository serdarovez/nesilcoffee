"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Undo2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  editHref?: string;
  isActive: boolean;
  isDeleted?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** Server actions, pre-bound to the row id by the parent. */
  onToggle: () => Promise<void>;
  onMoveUp: () => Promise<void>;
  onMoveDown: () => Promise<void>;
  onDelete: () => Promise<void>;
  onRestore?: () => Promise<void>;
  /** Blocks deletion with an explanation instead of silently doing nothing. */
  deleteBlockedReason?: string;
  confirmLabel: string;
};

const ICON_BTN =
  "grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-paper-alt hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";

export function RowActions({
  editHref,
  isActive,
  isDeleted,
  canMoveUp,
  canMoveDown,
  onToggle,
  onMoveUp,
  onMoveDown,
  onDelete,
  onRestore,
  deleteBlockedReason,
  confirmLabel,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const run = (fn: () => Promise<void>) => () =>
    startTransition(async () => {
      await fn();
    });

  if (isDeleted) {
    return (
      <div className="flex items-center gap-1">
        <span className="mr-1 text-xs text-ink-4">В корзине</span>
        {onRestore && (
          <button
            type="button"
            onClick={run(onRestore)}
            disabled={pending}
            title="Восстановить"
            className={ICON_BTN}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Undo2 className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={run(onMoveUp)}
        disabled={!canMoveUp || pending}
        title="Выше"
        className={ICON_BTN}
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={run(onMoveDown)}
        disabled={!canMoveDown || pending}
        title="Ниже"
        className={ICON_BTN}
      >
        <ChevronDown className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={run(onToggle)}
        disabled={pending}
        title={isActive ? "Скрыть с сайта" : "Показать на сайте"}
        className={ICON_BTN}
      >
        {isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>

      {editHref && (
        <Link href={editHref} title="Редактировать" className={ICON_BTN}>
          <Pencil className="h-4 w-4" />
        </Link>
      )}

      {deleteBlockedReason ? (
        <button
          type="button"
          disabled
          title={deleteBlockedReason}
          className={ICON_BTN}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : confirming ? (
        <span className="flex items-center gap-1 pl-1">
          <span className="text-xs text-ink-3">{confirmLabel}</span>
          <button
            type="button"
            onClick={run(onDelete)}
            disabled={pending}
            className="rounded-md bg-danger px-2 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "…" : "Да"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-md px-2 py-1 text-xs text-ink-3 hover:text-ink"
          >
            Нет
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          title="Удалить"
          className={cn(ICON_BTN, "hover:text-danger")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
