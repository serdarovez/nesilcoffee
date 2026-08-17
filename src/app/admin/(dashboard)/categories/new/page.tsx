import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/SimpleForms";

export const metadata: Metadata = { title: "Новая категория" };

export default async function NewCategoryPage() {
  await requireAdmin();
  return (
    <PageShell>
      <PageHeader
        title="Новая категория"
        back={{ href: "/admin/categories", label: "К списку категорий" }}
      />
      <CategoryForm values={{ isActive: true }} />
    </PageShell>
  );
}
