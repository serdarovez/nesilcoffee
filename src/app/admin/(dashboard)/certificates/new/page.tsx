import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { CertificateForm } from "@/components/admin/SimpleForms";

export const metadata: Metadata = { title: "Новый сертификат" };

export default async function NewCertificatePage() {
  await requireAdmin();
  return (
    <PageShell>
      <PageHeader
        title="Новый сертификат"
        back={{ href: "/admin/certificates", label: "К сертификатам" }}
      />
      <CertificateForm values={{ isActive: true }} />
    </PageShell>
  );
}
