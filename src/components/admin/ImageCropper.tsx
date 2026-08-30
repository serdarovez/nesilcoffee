"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";

/**
 * Pan-and-zoom crop, the way a profile photo is set on a phone.
 *
 * The crop is applied to the file *before* it is uploaded, so what lands in
 * the gallery is already the shape every consumer expects. Nothing downstream
 * has to know a crop happened — no column, no migration, and the admin list,
 * the site card and the order dialog all show the same framing without being
 * told about it. The cost of that choice is that re-cropping means uploading
 * the photo again, which is the trade we picked over threading a focal point
 * through every render site.
 *
 * The frame is a fixed square on screen; the image is laid over it at "cover"
 * scale and then moved. Zoom is bounded below at 1 so the image can never be
 * smaller than the frame, and the offset is clamped so no empty corner can be
 * dragged into view — which is why the exported canvas never has transparent
 * edges and needs no background fill.
 */

/** On-screen size of the crop frame. Output resolution is independent of it. */
const FRAME = 320;
/** Cap on the exported edge. `storeUpload` re-encodes and caps at 2400 anyway. */
const MAX_OUT = 1600;
const MAX_ZOOM = 4;

type Offset = { x: number; y: number };

export function ImageCropper({
  file,
  aspect = 1,
  onCancel,
  onCropped,
}: {
  file: File;
  /** width / height of the crop frame. 1 is a square. */
  aspect?: number;
  onCancel: () => void;
  onCropped: (cropped: File) => void;
}) {
  const frameW = FRAME;
  const frameH = Math.round(FRAME / aspect);

  // Created once, at mount. The caller gives this component a `key` derived
  // from the file, so a different file gets a fresh instance rather than one
  // that has to reset itself — which is what lets zoom, offset and the URL all
  // be plain initial state instead of an effect correcting them afterwards.
  const [url] = useState(() => URL.createObjectURL(file));
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const dragFrom = useRef<{ px: number; py: number; ox: number; oy: number } | null>(
    null,
  );

  // Release the blob when the cropper closes; without this every photo the
  // editor opens stays in memory for the life of the admin session.
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // "Cover" scale: the smallest factor at which the image still fills the
  // frame in both axes. Everything else is expressed as a multiple of it.
  const baseScale = natural
    ? Math.max(frameW / natural.w, frameH / natural.h)
    : 1;
  const drawScale = baseScale * zoom;
  const renderedW = natural ? natural.w * drawScale : 0;
  const renderedH = natural ? natural.h * drawScale : 0;

  // How far the image may travel before an edge would enter the frame.
  const limitX = Math.max(0, (renderedW - frameW) / 2);
  const limitY = Math.max(0, (renderedH - frameH) / 2);

  const clamp = useCallback(
    (o: Offset): Offset => ({
      x: Math.min(limitX, Math.max(-limitX, o.x)),
      y: Math.min(limitY, Math.max(-limitY, o.y)),
    }),
    [limitX, limitY],
  );

  // The offset actually used, derived rather than stored. Zooming out shrinks
  // the travel limits, so a position that was legal at the old zoom would let
  // an empty corner into the frame at the new one. Clamping here rather than
  // writing corrected state back from an effect keeps a single source of truth
  // and avoids the extra render that a correcting effect costs.
  const pos = clamp(offset);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragFrom.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const from = dragFrom.current;
    if (!from) return;
    setOffset(
      clamp({
        x: from.ox + (e.clientX - from.px),
        y: from.oy + (e.clientY - from.py),
      }),
    );
  };

  const endDrag = (e: React.PointerEvent) => {
    dragFrom.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  async function apply() {
    const img = imgRef.current;
    if (!img || !natural) return;
    setBusy(true);
    setError(null);
    try {
      // Screen position of the image's top-left corner inside the frame.
      const left = (frameW - renderedW) / 2 + pos.x;
      const top = (frameH - renderedH) / 2 + pos.y;

      // The frame, expressed back in the source image's own pixels.
      const sx = -left / drawScale;
      const sy = -top / drawScale;
      const sw = frameW / drawScale;
      const sh = frameH / drawScale;

      // Export at the crop's true resolution, capped — never upscale past what
      // the source actually holds.
      const outW = Math.max(1, Math.min(Math.round(sw), MAX_OUT));
      const outH = Math.max(1, Math.round(outW / aspect));

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no 2d context");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

      const encode = (type: string) =>
        new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, type, 0.92),
        );

      // WebP first for size, PNG as the fallback — Safari only learned to
      // *encode* webp from a canvas in 16.4, and older versions resolve null
      // rather than throwing. The server re-encodes to webp either way, so the
      // fallback costs nothing but a slightly larger upload.
      const blob = (await encode("image/webp")) ?? (await encode("image/png"));
      if (!blob) throw new Error("toBlob returned null");

      const ext = blob.type === "image/png" ? "png" : "webp";
      const base = file.name.replace(/\.[^.]+$/, "") || "image";
      onCropped(new File([blob], `${base}.${ext}`, { type: blob.type }));
    } catch {
      setError("Не удалось обрезать изображение");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Обрезка изображения"
      onClick={onCancel}
    >
      <div
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-paper p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">
            Выберите область
          </h2>
          <p className="text-xs text-ink-4">
            Перетащите фото и приблизьте так, чтобы лицо оказалось в рамке.
            Обрежется ровно то, что видно.
          </p>
        </div>

        {/* The frame. `touch-none` hands every gesture to the pointer handlers
          * instead of letting the browser scroll the dialog underneath. */}
        <div
          className="relative mx-auto touch-none overflow-hidden rounded-xl bg-paper-mute"
          style={{ width: frameW, height: frameH }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              ref={imgRef}
              src={url}
              alt=""
              draggable={false}
              onLoad={(e) =>
                setNatural({
                  w: e.currentTarget.naturalWidth,
                  h: e.currentTarget.naturalHeight,
                })
              }
              className="absolute max-w-none cursor-grab select-none active:cursor-grabbing"
              style={{
                width: renderedW || undefined,
                height: renderedH || undefined,
                left: (frameW - renderedW) / 2 + pos.x,
                top: (frameH - renderedH) / 2 + pos.y,
              }}
            />
          )}
          {!natural && (
            <div className="absolute inset-0 grid place-items-center text-ink-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ZoomOut className="h-4 w-4 shrink-0 text-ink-4" />
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Приближение"
            className="h-10 w-full accent-[#191919]"
          />
          <ZoomIn className="h-4 w-4 shrink-0 text-ink-4" />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-3 transition-colors hover:bg-paper-alt hover:text-ink"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => void apply()}
            disabled={!natural || busy}
            className="inline-flex items-center gap-2 rounded-lg bg-paper-dark px-4 py-2 text-sm font-medium text-ink-inverse transition-colors hover:bg-black disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Обрезать и загрузить
          </button>
        </div>
      </div>
    </div>
  );
}
