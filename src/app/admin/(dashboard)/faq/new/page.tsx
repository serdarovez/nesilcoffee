import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { FaqForm } from "@/components/admin/SimpleForms";

export const metadata: Metadata = { title: "Новый вопрос" };

export default async function NewFaqPage() {
  await requireAdmin();
  return (
    <PageShell>
      <PageHeader
        title="Новый вопрос"
        back={{ href: "/admin/faq", label: "К списку вопросов" }}
      />
      <FaqForm values={{ isActive: true }} />
    </PageShell>
  );
}
