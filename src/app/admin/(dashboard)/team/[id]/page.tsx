import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, toLocalized } from "@/lib/i18n-field";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { TeamForm } from "@/components/admin/SimpleForms";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const row = await prisma.teamMember.findUnique({ where: { id }, select: { name: true } });
  return { title: row ? pick(row.name, "ru") : "Сотрудник" };
}

export default async function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const row = await prisma.teamMember.findUnique({ where: { id }, include: { avatar: true } });
  if (!row) notFound();

  return (
    <PageShell>
      <PageHeader
        title={pick(row.name, "ru")}
        description={pick(row.role, "ru")}
        back={{ href: "/admin/team", label: "К команде" }}
      />
      <TeamForm
        values={{
          id: row.id,
          name: toLocalized(row.name),
          role: toLocalized(row.role),
          phone: row.phone,
          email: row.email,
          avatar: row.avatar
            ? { id: row.avatar.id, path: row.avatar.path, width: row.avatar.width, height: row.avatar.height, blurDataUrl: row.avatar.blurDataUrl, bytes: row.avatar.bytes }
            : null,
          isActive: row.isActive,
        }}
      />
    </PageShell>
  );
}
