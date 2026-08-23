import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, toLocalized } from "@/lib/i18n-field";
import { parseFieldRules } from "@/lib/category-fields";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: product ? pick(product.name, "ru") : "Товар" };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { image: true } }),
    prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, fieldRules: true },
    }),
  ]);

  if (!product) notFound();

  return (
    <PageShell>
      <PageHeader
        title={pick(product.name, "ru")}
        description={`/${product.slug}`}
        back={{ href: "/admin/products", label: "К списку продукции" }}
      />
      <ProductForm
        values={{
          id: product.id,
          name: toLocalized(product.name),
          description: product.description ? toLocalized(product.description) : null,
          tagline: product.tagline ? toLocalized(product.tagline) : null,
          slug: product.slug,
          categoryId: product.categoryId,
          weight: product.weight,
          arabica: product.arabica,
          robusta: product.robusta,
          roast: product.roast,
          acidity: product.acidity,
          image: product.image
            ? {
                id: product.image.id,
                path: product.image.path,
                width: product.image.width,
                height: product.image.height,
                blurDataUrl: product.image.blurDataUrl,
                bytes: product.image.bytes,
              }
            : null,
          isActive: product.isActive,
        }}
        categories={categories.map((c) => ({
          id: c.id,
          label: pick(c.name, "ru"),
          rules: parseFieldRules(c.fieldRules),
        }))}
      />
    </PageShell>
  );
}
