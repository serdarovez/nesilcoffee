"use client";

import { useState } from "react";
import { CheckCircle2, Info, MapPin } from "lucide-react";
import { mapEmbedUrl, parseMapLink } from "@/lib/map-link";
import { inputClass } from "./ui";

/**
 * Where this office sits on the contacts map.
 *
 * The editor pastes whatever Google gave them and gets an immediate preview,
 * so a wrong pin is caught here rather than discovered later on the live site.
 * The server parses the same string again on save — this preview is a
 * convenience, never the source of truth.
 */
export function MapLinkField({
  defaultValue,
  error,
}: {
  defaultValue?: string | null;
  error?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const parsed = parseMapLink(value);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">Ссылка на Google Карты</span>

      <input
        name="mapLink"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://www.google.com/maps/place/..."
        className={inputClass}
      />

      {error && <span className="text-xs text-danger">{error}</span>}

      {!error && parsed.kind === "empty" && (
        <span className="text-xs text-ink-4">
          Необязательно. Пусто — на карте останется головной офис.
        </span>
      )}

      {parsed.kind === "unrecognised" && !error && (
        <span className="flex items-start gap-1 text-xs text-danger">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          Не удалось найти координаты. Откройте место в Google Картах и
          скопируйте ссылку из адресной строки браузера — она содержит
          координаты после символа «@».
        </span>
      )}

      {parsed.kind === "short" && !error && (
        <span className="flex items-start gap-1 text-xs text-ink-3">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          Короткая ссылка — координаты определятся при сохранении.
        </span>
      )}

      {parsed.kind === "pin" && (
        <>
          <span className="flex items-center gap-1 text-xs text-ink-2">
            <CheckCircle2 className="h-3 w-3 shrink-0 text-success" />
            Точка найдена: {parsed.pin.lat.toFixed(6)}, {parsed.pin.lng.toFixed(6)}
          </span>
          <div className="mt-1 overflow-hidden rounded-lg border border-line">
            <iframe
              // Remount on move so the iframe actually re-navigates.
              key={`${parsed.pin.lat},${parsed.pin.lng}`}
              src={mapEmbedUrl(parsed.pin)}
              title="Предпросмотр карты"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-44 w-full border-0"
            />
          </div>
        </>
      )}

      {parsed.kind === "empty" && (
        <span className="flex items-start gap-1 text-xs text-ink-4">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
          Можно вставить и просто координаты: 37.848669, 58.566173
        </span>
      )}
    </div>
  );
}
