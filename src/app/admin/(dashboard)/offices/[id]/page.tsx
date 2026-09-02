import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { toLocalized, pickList } from "@/lib/i18n-field";
import { countryName } from "@/lib/countries";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { OfficeForm } from "@/components/admin/OfficeForm";

export const metadata: Metadata = { title: "Офис" };

export default async function EditOfficePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [office, existing] = await Promise.all([
    prisma.countryContact.findUnique({ where: { id } }),
    prisma.countryContact.findMany({ select: { country: true } }),
  ]);
  if (!office) notFound();

  return (
    <PageShell>
      <PageHeader
        title={countryName(office.country)}
        description="Этот адрес видят посетители из этой страны."
        back={{ href: "/admin/offices", label: "К списку адресов" }}
      />
      <OfficeForm
        taken={existing.map((row) => row.country)}
        values={{
          id: office.id,
          country: office.country,
          address: toLocalized(office.address),
          phones: pickList(office.phones),
          isActive: office.isActive,
          mapUrl: office.mapUrl,
        }}
      />
    </PageShell>
  );
}
