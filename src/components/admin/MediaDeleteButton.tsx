"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import { deleteMediaAction } from "@/server/actions/media";
import type { MediaUsage } from "@/server/media";

/**
 * Delete control for the gallery detail panel.
 *
 * The usage list is resolved on the server and passed in, so the dialog can
 * name every affected item before anything happens. Products are called out
 * separately because they are the only consumer that goes off the site when it
 * loses its image — everything else keeps rendering without one.
 */
export function MediaDeleteButton({
  id,
  usage,
}: {
  id: string;
  usage: MediaUsage[];
}) {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  const disabling = usage.filter((u) => u.disables);
  const detaching = usage.filter((u) => !u.disables);

  return (
    <>
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-line-strong text-sm text-ink-2 transition-colors hover:border-danger hover:bg-danger/5 hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
        Удалить изображение
      </button>

      <ConfirmDialog
        open={asking}
        pending={pending}
        title="Удалить изображение?"
        confirmLabel="Удалить"
        onCancel={() => setAsking(false)}
        onConfirm={() =>
          startTransition(async () => {
            await deleteMediaAction(id);
          })
        }
      >
        {usage.length === 0 ? (
          <p>
            Изображение нигде не используется. Файл будет удалён без
            последствий.
          </p>
        ) : (
          <>
            <p>
              Используется в {usage.length}{" "}
              {plural(usage.length, "месте", "местах", "местах")}:
            </p>

            {disabling.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {disabling.map((u) => (
                  <li key={`${u.kind}-${u.id}`} className="flex gap-2">
                    <span aria-hidden className="text-danger">
                      ✖
                    </span>
                    <span className="min-w-0">
                      <span className="font-medium text-ink">
                        Товар «{u.label}»
                      </span>
                      <br />
                      <span className="text-xs text-danger">
                        будет скрыт с сайта — нужна фотография
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {detaching.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {detaching.map((u) => (
                  <li key={`${u.kind}-${u.id}`} className="flex gap-2">
                    <span aria-hidden className="text-ink-4">
                      •
                    </span>
                    <span className="min-w-0">
                      <span className="text-ink">{label(u)}</span>
                      <br />
                      <span className="text-xs text-ink-4">
                        останется без изображения
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </ConfirmDialog>
    </>
  );
}

const KIND_LABEL: Record<MediaUsage["kind"], string> = {
  product: "Товар",
  homeSlide: "Слайдер на главной",
  heroBackground: "Слайдер продукции — фон",
  heroProductArt: "Слайдер продукции — товар",
  teamMember: "Команда",
  certificate: "Сертификат",
  expert: "Эксперт",
};

function label(usage: MediaUsage): string {
  return `${KIND_LABEL[usage.kind]} — ${usage.label}`;
}

/** Russian plural agreement for the usage count. */
function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
