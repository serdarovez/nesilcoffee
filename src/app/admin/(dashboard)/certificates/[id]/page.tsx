import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, toLocalized } from "@/lib/i18n-field";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { CertificateForm } from "@/components/admin/SimpleForms";

export const metadata: Metadata = { title: "Сертификат" };

export default async function EditCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const row = await prisma.certificate.findUnique({
    where: { id },
    include: { image: true },
  });
  if (!row) notFound();

  return (
    <PageShell>
      <PageHeader
        title="Сертификат"
        description={pick(row.name, "ru").replace(/\n/g, " ")}
        back={{ href: "/admin/certificates", label: "К сертификатам" }}
      />
      <CertificateForm
        values={{
          id: row.id,
          name: toLocalized(row.name),
          description: toLocalized(row.description),
          image: row.image
            ? {
                id: row.image.id,
                path: row.image.path,
                width: row.image.width,
                height: row.image.height,
                blurDataUrl: row.image.blurDataUrl,
                bytes: row.image.bytes,
              }
            : null,
          isActive: row.isActive,
        }}
      />
    </PageShell>
  );
}
