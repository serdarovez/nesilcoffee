"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Upload, ImageIcon, Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropper } from "./ImageCropper";

export type MediaRef = {
  id: string;
  path: string;
  /** The filename as uploaded. `path` is random hex, so this is the only
   *  label an editor can recognise. Null for rows predating the column. */
  originalName?: string | null;
  width?: number | null;
  height?: number | null;
  blurDataUrl?: string | null;
  bytes?: number | null;
};

type Props = {
  value: MediaRef | null;
  onChange: (media: MediaRef | null) => void;
  label?: string;
  /** Shown under the field — e.g. the aspect ratio the design expects. */
  hint?: string;
  required?: boolean;
  /**
   * Set this where the slot renders a fixed shape, and a newly chosen file
   * goes through the crop step before uploading. 1 is a square.
   *
   * Only worth it where the image is `object-cover`'d into a set frame —
   * portraits in the team and expert cards. The product packs and hero art are
   * transparent PNGs shown whole with `object-contain`, and cropping those
   * would cut the packaging.
   */
  cropAspect?: number;
};

function formatBytes(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export function MediaPicker({
  value,
  onChange,
  label,
  hint,
  required,
  cropAspect,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-semibold text-ink">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </span>
      )}

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-paper-mute">
            <Image
              src={value.path}
              alt=""
              fill
              sizes="80px"
              className="object-contain"
              {...(value.blurDataUrl
                ? { placeholder: "blur" as const, blurDataURL: value.blurDataUrl }
                : {})}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span
              className="truncate text-sm text-ink"
              title={value.originalName ?? value.path}
            >
              {value.originalName ?? value.path.split("/").pop()}
            </span>
            <span className="text-xs text-ink-4">
              {value.width && value.height ? `${value.width}×${value.height}` : ""}
              {value.bytes ? ` · ${formatBytes(value.bytes)}` : ""}
            </span>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-xs font-medium text-ink-2 underline underline-offset-2 hover:text-ink"
              >
                Заменить
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="text-xs font-medium text-ink-4 underline underline-offset-2 hover:text-danger"
              >
                Убрать
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong bg-paper text-ink-3 transition-colors hover:border-ink-4 hover:text-ink-2"
        >
          <ImageIcon className="h-5 w-5" />
          <span className="text-sm">Выбрать изображение</span>
        </button>
      )}

      {hint && <span className="text-xs text-ink-4">{hint}</span>}

      {open && (
        <MediaDialog
          onClose={() => setOpen(false)}
          onPick={(media) => {
            onChange(media);
            setOpen(false);
          }}
          selectedId={value?.id}
          cropAspect={cropAspect}
        />
      )}
    </div>
  );
}

function MediaDialog({
  onClose,
  onPick,
  selectedId,
  cropAspect,
}: {
  onClose: () => void;
  onPick: (media: MediaRef) => void;
  selectedId?: string;
  cropAspect?: number;
}) {
  const [items, setItems] = useState<MediaRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // A file chosen but not yet uploaded, waiting on the crop step.
  const [pendingCrop, setPendingCrop] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // No synchronous setState in the effect body: `loading` already starts true,
  // so the first fetch only ever sets state asynchronously. The cancelled flag
  // stops a late response from writing to an unmounted dialog.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/admin/media");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setItems(data.items);
      } catch {
        if (!cancelled) setError("Не удалось загрузить список изображений");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Не удалось загрузить файл");
          return;
        }
        setItems((prev) => [data, ...prev]);
        onPick(data);
      } catch {
        setError("Не удалось загрузить файл");
      } finally {
        setUploading(false);
      }
    },
    [onPick],
  );

  /**
   * A file chosen from disk. Where the slot has a fixed shape it goes through
   * the crop step first; the upload then receives the cropped file and knows
   * nothing about any of this.
   *
   * Only new files are cropped. Picking an existing image from the gallery
   * below uses it as stored — it may already be in use elsewhere, so silently
   * re-cropping it would change those other places too.
   */
  const accept = useCallback(
    (file: File) => {
      if (cropAspect) setPendingCrop(file);
      else void upload(file);
    },
    [cropAspect, upload],
  );

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Выбор изображения"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-paper shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">
            Изображения
          </h2>
          <div className="flex items-center gap-3">
            {/* Deletion deliberately lives on the gallery screen, not here:
             * it needs the full usage list to warn about, and this dialog is
             * open on top of an unsaved form. New tab for the same reason. */}
            <a
              href="/admin/gallery"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-ink-3 underline underline-offset-2 transition-colors hover:text-ink"
            >
              Управление и удаление — в Галерее
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-paper-alt hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="border-b border-line p-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) accept(file);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed py-6 transition-colors",
              dragging
                ? "border-ink bg-paper-alt"
                : "border-line-strong hover:border-ink-4",
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-ink-3" />
                <span className="text-sm text-ink-3">Загрузка…</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-ink-3" />
                <span className="text-sm text-ink-2">
                  Перетащите файл сюда или нажмите, чтобы выбрать
                </span>
                <span className="text-xs text-ink-4">
                  JPG, PNG, WebP или AVIF — до 15 МБ
                </span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) accept(file);
                e.target.value = "";
              }}
            />
          </div>

          {error && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-ink-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Загрузка…</span>
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink-4">
              Пока нет загруженных изображений
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {items.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onPick(m)}
                  title={m.originalName ?? m.path}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-lg border-2 bg-paper-alt transition-colors",
                    m.id === selectedId
                      ? "border-ink"
                      : "border-transparent hover:border-line-strong",
                  )}
                >
                  <Image
                    src={m.path}
                    alt=""
                    fill
                    sizes="150px"
                    className="object-contain p-1"
                    {...(m.blurDataUrl
                      ? { placeholder: "blur" as const, blurDataURL: m.blurDataUrl }
                      : {})}
                  />
                  {m.id === selectedId && (
                    <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-ink-inverse">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* A sibling of the backdrop, not a child: nested inside, a click on the
      * cropper's own backdrop would bubble to `onClose` and shut the picker
      * behind it as well, losing the file the editor just chose. */}
    {pendingCrop && cropAspect && (
      <ImageCropper
        /* A different file gets a different instance, so the cropper starts
         * from a clean zoom and position instead of resetting itself. */
        key={`${pendingCrop.name}-${pendingCrop.size}-${pendingCrop.lastModified}`}
        file={pendingCrop}
        aspect={cropAspect}
        onCancel={() => setPendingCrop(null)}
        onCropped={(cropped) => {
          setPendingCrop(null);
          void upload(cropped);
        }}
      />
    )}
    </>
  );
}
