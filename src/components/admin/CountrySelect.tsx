"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { COUNTRIES, countryName } from "@/lib/countries";
import { inputClass } from "./ui";

/**
 * Country picker for the offices form.
 *
 * Replaces a two-character text box, which let an editor save "QQ" or "az " or
 * a typo'd "AE" when they meant "AZ" — none of which any visitor would ever
 * match, so the office silently never appeared. Picking from the real ISO list
 * makes that class of mistake impossible.
 *
 * Search matches the Russian name and the code, because both are things a
 * person reaches for: "азер" and "AZ" both land on Азербайджан.
 */
export function CountrySelect({
  name,
  defaultValue,
  error,
  /** Codes already used by another office — each country may only have one. */
  taken = [],
}: {
  name: string;
  defaultValue?: string;
  error?: string;
  taken?: string[];
}) {
  const [code, setCode] = useState((defaultValue ?? "").toUpperCase());
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const takenSet = useMemo(
    () => new Set(taken.map((c) => c.toUpperCase()).filter((c) => c !== code)),
    [taken, code],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      ([c, label]) => label.toLowerCase().includes(q) || c.toLowerCase().startsWith(q),
    );
  }, [query]);

  // Keep the highlight inside the list as it shrinks under the query.
  const activeIndex = Math.min(active, Math.max(matches.length - 1, 0));

  function choose(next: string) {
    setCode(next);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const delta = e.key === "ArrowDown" ? 1 : -1;
      const count = matches.length;
      if (count) setActive((activeIndex + delta + count) % count);
    } else if (e.key === "Enter") {
      // Never let the dropdown's Enter submit the surrounding form.
      if (open && matches[activeIndex]) {
        e.preventDefault();
        choose(matches[activeIndex][0]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  const selectedLabel = code ? `${countryName(code)} · ${code}` : "";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">
        Страна
        <span className="ml-1 text-danger">*</span>
      </span>

      <div
        className="relative"
        onBlur={(e) => {
          // Only close when focus actually leaves the widget, otherwise
          // clicking an option would close the list before it registers.
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setOpen(false);
            setQuery("");
          }
        }}
      >
        <input type="hidden" name={name} value={code} />

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            value={open ? query : selectedLabel}
            placeholder="Начните вводить название или код"
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            className={`${inputClass} pr-9`}
          />
          <ChevronDown
            className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>

        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-line-strong bg-paper py-1 shadow-lg"
          >
            {matches.length === 0 && (
              <li className="flex items-center gap-2 px-3 py-2 text-sm text-ink-4">
                <Search className="h-3.5 w-3.5" />
                Ничего не найдено
              </li>
            )}
            {matches.map(([c, label], i) => {
              const isTaken = takenSet.has(c);
              return (
                <li key={c}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c === code}
                    disabled={isTaken}
                    // Keeps focus on the input so onBlur does not fire first.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(c)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      isTaken
                        ? "cursor-not-allowed text-ink-4"
                        : i === activeIndex
                          ? "bg-paper-alt text-ink"
                          : "text-ink-2"
                    }`}
                  >
                    <span className="flex-1 truncate">{label}</span>
                    {isTaken && <span className="text-xs">уже добавлена</span>}
                    <span className="font-mono text-xs text-ink-4">{c}</span>
                    {c === code && <Check className="h-3.5 w-3.5 text-ink" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : (
        <span className="text-xs text-ink-4">
          Посетители из этой страны увидят адрес, телефоны и карту отсюда.
        </span>
      )}
    </div>
  );
}
