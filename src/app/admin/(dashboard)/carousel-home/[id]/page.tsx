import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick } from "@/lib/i18n-field";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { HomeSlideForm } from "@/components/admin/HomeSlideForm";

export const metadata: Metadata = { title: "Слайд карусели" };

export default async function EditHomeSlidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [slide, products] = await Promise.all([
    prisma.homeSlide.findUnique({
      where: { id },
      include: { imageOverride: true, product: { include: { image: true } } },
    }),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  if (!slide) notFound();

  return (
    <PageShell>
      <PageHeader
        title={pick(slide.product.name, "ru")}
        description="Слайд карусели на главной странице"
        back={{ href: "/admin/carousel-home", label: "К карусели" }}
      />
      <HomeSlideForm
        values={{
          id: slide.id,
          productId: slide.productId,
          imageOverride: slide.imageOverride
            ? {
                id: slide.imageOverride.id,
                path: slide.imageOverride.path,
                width: slide.imageOverride.width,
                height: slide.imageOverride.height,
                blurDataUrl: slide.imageOverride.blurDataUrl,
                bytes: slide.imageOverride.bytes,
              }
            : null,
          productImagePath: slide.product.image?.path ?? null,
          isActive: slide.isActive,
        }}
        products={products.map((p) => ({ id: p.id, label: pick(p.name, "ru") }))}
      />
    </PageShell>
  );
}
