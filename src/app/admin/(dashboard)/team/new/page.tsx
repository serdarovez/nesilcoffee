import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { TeamForm } from "@/components/admin/SimpleForms";

export const metadata: Metadata = { title: "Новый сотрудник" };

export default async function NewTeamMemberPage() {
  await requireAdmin();
  return (
    <PageShell>
      <PageHeader title="Новый сотрудник" back={{ href: "/admin/team", label: "К команде" }} />
      <TeamForm values={{ isActive: true }} />
    </PageShell>
  );
}
