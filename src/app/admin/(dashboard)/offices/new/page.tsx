import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { OfficeForm } from "@/components/admin/OfficeForm";

export const metadata: Metadata = { title: "Новый офис" };

export default async function NewOfficePage() {
  await requireAdmin();

  // Countries that already have an office, so the picker can grey them out
  // instead of letting the editor fill in a whole form and be told at the end.
  const existing = await prisma.countryContact.findMany({
    select: { country: true },
  });

  return (
    <PageShell>
      <PageHeader
        title="Новый офис"
        description="Адрес для посетителей из одной страны."
        back={{ href: "/admin/offices", label: "К списку адресов" }}
      />
      <OfficeForm
        values={{ isActive: true }}
        taken={existing.map((row) => row.country)}
      />
    </PageShell>
  );
}
