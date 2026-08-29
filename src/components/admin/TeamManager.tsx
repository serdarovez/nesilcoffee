"use client";

import Image from "next/image";
import { SortableList } from "./SortableList";
import { StatusDot, LocaleBadges } from "./ui";
import { RowActions } from "./RowActions";
import { LOCALE_ORDER } from "@/lib/i18n-field";
import {
  reorderTeamMembers,
  toggleTeamMember,
  deleteTeamMember,
  restoreTeamMember,
} from "@/server/actions/content";

export type TeamRow = {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  avatarPath: string | null;
  isActive: boolean;
  /** Locales that have a translated role, for the badge row. */
  filledRoleLocales: string[];
};

/**
 * Drag-to-reorder list of team members. Mirrors the carousel managers: the
 * grip reorders (persisted by reorderTeamMembers), while each row keeps the
 * edit / show-hide / delete actions. The up/down chevrons are hidden here
 * since the drag handle replaces them.
 */
export function TeamManager({ members }: { members: TeamRow[] }) {
  const byId = new Map(members.map((m) => [m.id, m]));

  return (
    <SortableList ids={members.map((m) => m.id)} onReorder={reorderTeamMembers}>
      {(id) => {
        const m = byId.get(id);
        if (!m) return null;
        return (
          <div className="flex items-center gap-3 pr-1">
            {/* object-top on the avatar: the uploads are 2:3 portraits, and a
              * centred crop into this 44px circle lands on the chest rather
              * than the face — which is the one thing this row is for. */}
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-paper-alt">
              {m.avatarPath && (
                <Image
                  src={m.avatarPath}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover object-top"
                />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                <StatusDot active={m.isActive} />
                {m.name}
              </span>
              <span className="truncate text-xs text-ink-4">
                {m.role}
                {m.phone ? ` · ${m.phone}` : ""}
              </span>
            </div>
            <div className="hidden shrink-0 sm:block">
              <LocaleBadges filled={m.filledRoleLocales} all={LOCALE_ORDER} />
            </div>
            <RowActions
              editHref={`/admin/team/${m.id}`}
              isActive={m.isActive}
              hideMove
              onToggle={toggleTeamMember.bind(null, m.id)}
              onDelete={deleteTeamMember.bind(null, m.id)}
              onRestore={restoreTeamMember.bind(null, m.id)}
              confirmLabel="Удалить?"
            />
          </div>
        );
      }}
    </SortableList>
  );
}
