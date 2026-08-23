import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick } from "@/lib/i18n-field";
import { parseFieldRules } from "@/lib/category-fields";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Новый товар" };

export default async function NewProductPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, fieldRules: true },
  });

  return (
    <PageShell>
      <PageHeader
        title="Новый товар"
        back={{ href: "/admin/products", label: "К списку продукции" }}
      />
      <ProductForm
        values={{ isActive: true, roast: 3, acidity: 3 }}
        categories={categories.map((c) => ({
          id: c.id,
          label: pick(c.name, "ru"),
          rules: parseFieldRules(c.fieldRules),
        }))}
      />
    </PageShell>
  );
}
