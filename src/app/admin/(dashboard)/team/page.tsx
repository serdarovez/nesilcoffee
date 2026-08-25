import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, filledLocales } from "@/lib/i18n-field";
import { PageShell, PageHeader, EmptyState } from "@/components/admin/ui";
import { TeamManager, type TeamRow } from "@/components/admin/TeamManager";

export const metadata: Metadata = { title: "Команда" };

export default async function TeamPage() {
  await requireAdmin();
  const members = await prisma.teamMember.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { avatar: true },
  });

  const rows: TeamRow[] = members.map((m) => ({
    id: m.id,
    name: pick(m.name, "ru"),
    role: pick(m.role, "ru"),
    phone: m.phone,
    avatarPath: m.avatar?.path ?? null,
    isActive: m.isActive,
    filledRoleLocales: filledLocales(m.role),
  }));

  return (
    <PageShell>
      <PageHeader
        title="Команда"
        description="Перетащите за рукоятку, чтобы изменить порядок. Карусель сотрудников на главной, странице продукции и «О нас»."
        action={{ href: "/admin/team/new", label: "Добавить сотрудника" }}
      />
      {rows.length === 0 ? (
        <EmptyState message="Пока нет сотрудников" />
      ) : (
        <TeamManager members={rows} />
      )}
    </PageShell>
  );
}
