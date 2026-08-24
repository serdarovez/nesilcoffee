import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, toLocalized } from "@/lib/i18n-field";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/SimpleForms";
import { parseFieldRules } from "@/lib/category-fields";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const row = await prisma.category.findUnique({ where: { id }, select: { name: true } });
  return { title: row ? pick(row.name, "ru") : "Категория" };
}

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const row = await prisma.category.findUnique({ where: { id } });
  if (!row) notFound();

  return (
    <PageShell>
      <PageHeader
        title={pick(row.name, "ru")}
        description={`/${row.slug}`}
        back={{ href: "/admin/categories", label: "К списку категорий" }}
      />
      <CategoryForm
        values={{
          id: row.id,
          name: toLocalized(row.name),
          slug: row.slug,
          isActive: row.isActive,
          fieldRules: parseFieldRules(row.fieldRules),
        }}
      />
    </PageShell>
  );
}
