import type { Metadata } from "next";
import Image from "next/image";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, filledLocales, LOCALE_ORDER } from "@/lib/i18n-field";
import { PageShell, PageHeader, EmptyState, StatusDot, LocaleBadges } from "@/components/admin/ui";
import { RowActions } from "@/components/admin/RowActions";
import { toggleTeamMember, deleteTeamMember, restoreTeamMember, moveTeamMember } from "@/server/actions/content";

export const metadata: Metadata = { title: "Команда" };

export default async function TeamPage() {
  await requireAdmin();
  const members = await prisma.teamMember.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { avatar: true },
  });

  return (
    <PageShell>
      <PageHeader
        title="Команда"
        description="Карусель сотрудников на главной, странице продукции и «О нас»."
        action={{ href: "/admin/team/new", label: "Добавить сотрудника" }}
      />
      {members.length === 0 ? (
        <EmptyState message="Пока нет сотрудников" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-paper">
          {members.map((m, index) => (
            <div key={m.id} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-paper-alt">
                {m.avatar && (
                  <Image src={m.avatar.path} alt="" fill sizes="44px" className="object-cover" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                  <StatusDot active={m.isActive} />
                  {pick(m.name, "ru")}
                </span>
                <span className="truncate text-xs text-ink-4">
                  {pick(m.role, "ru")}
                  {m.phone ? ` · ${m.phone}` : ""}
                </span>
              </div>
              <div className="hidden shrink-0 sm:block">
                <LocaleBadges filled={filledLocales(m.role)} all={LOCALE_ORDER} />
              </div>
              <RowActions
                editHref={`/admin/team/${m.id}`}
                isActive={m.isActive}
                canMoveUp={index > 0}
                canMoveDown={index < members.length - 1}
                onToggle={toggleTeamMember.bind(null, m.id)}
                onMoveUp={moveTeamMember.bind(null, m.id, -1)}
                onMoveDown={moveTeamMember.bind(null, m.id, 1)}
                onDelete={deleteTeamMember.bind(null, m.id)}
                onRestore={restoreTeamMember.bind(null, m.id)}
                confirmLabel="Удалить?"
              />
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
