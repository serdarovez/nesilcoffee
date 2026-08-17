"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { GripVertical, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  ids: string[];
  onReorder: (ids: string[]) => Promise<void>;
  children: (id: string, index: number) => React.ReactNode;
};

/**
 * Drag-to-reorder built on native HTML5 drag events rather than a library —
 * the list is short and the interaction simple, so a dependency would be more
 * code than the feature.
 *
 * Order is applied optimistically and persisted on drop. Keyboard users get
 * Ctrl+Arrow on the focused handle, since native drag has no keyboard path.
 */
export function SortableList({ ids: initialIds, onReorder, children }: Props) {
  const [ids, setIds] = useState(initialIds);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const committed = useRef(initialIds);

  // Re-sync when the server sends a different set (add/remove elsewhere).
  useEffect(() => {
    if (initialIds.join() !== committed.current.join()) {
      committed.current = initialIds;
      setIds(initialIds);
    }
  }, [initialIds]);

  function commit(next: string[]) {
    const previous = committed.current;
    setIds(next);
    committed.current = next;
    startTransition(async () => {
      try {
        await onReorder(next);
      } catch {
        // Put the visible order back if the write failed, rather than leaving
        // the screen disagreeing with the database.
        setIds(previous);
        committed.current = previous;
      }
    });
  }

  function move(id: string, delta: number) {
    const from = ids.indexOf(id);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= ids.length) return;
    const next = [...ids];
    [next[from], next[to]] = [next[to], next[from]];
    commit(next);
  }

  function handleDrop(targetId: string) {
    if (!dragging || dragging === targetId) return;
    const from = ids.indexOf(dragging);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;

    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, dragging);
    commit(next);
  }

  return (
    <div className="relative flex flex-col gap-2">
      {pending && (
        <span className="absolute -top-6 right-0 inline-flex items-center gap-1 text-xs text-ink-4">
          <Loader2 className="h-3 w-3 animate-spin" />
          Сохранение порядка…
        </span>
      )}

      {ids.map((id, index) => (
        <div
          key={id}
          draggable
          onDragStart={() => setDragging(id)}
          onDragEnd={() => {
            setDragging(null);
            setOver(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(id);
          }}
          onDragLeave={() => setOver((o) => (o === id ? null : o))}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(id);
            setOver(null);
          }}
          className={cn(
            "flex items-stretch gap-2 rounded-xl border bg-paper transition-colors",
            dragging === id ? "border-ink opacity-50" : "border-line",
            over === id && dragging !== id ? "border-ink" : "",
          )}
        >
          <button
            type="button"
            aria-label={`Переместить, позиция ${index + 1} из ${ids.length}`}
            title="Перетащите или нажмите Ctrl+↑ / Ctrl+↓"
            onKeyDown={(e) => {
              if (!e.ctrlKey) return;
              if (e.key === "ArrowUp") {
                e.preventDefault();
                move(id, -1);
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                move(id, 1);
              }
            }}
            className="flex w-8 shrink-0 cursor-grab items-center justify-center rounded-l-xl text-ink-4 transition-colors hover:bg-paper-alt hover:text-ink active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1 py-2.5 pr-3">{children(id, index)}</div>
        </div>
      ))}
    </div>
  );
}
