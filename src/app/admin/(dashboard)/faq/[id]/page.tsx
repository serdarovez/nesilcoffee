import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, toLocalized } from "@/lib/i18n-field";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { FaqForm } from "@/components/admin/SimpleForms";

export const metadata: Metadata = { title: "Вопрос" };

export default async function EditFaqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const row = await prisma.faqItem.findUnique({ where: { id } });
  if (!row) notFound();

  return (
    <PageShell>
      <PageHeader
        title="Вопрос"
        description={pick(row.question, "ru")}
        back={{ href: "/admin/faq", label: "К списку вопросов" }}
      />
      <FaqForm
        values={{
          id: row.id,
          question: toLocalized(row.question),
          answer: toLocalized(row.answer),
          isActive: row.isActive,
        }}
      />
    </PageShell>
  );
}
