import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick } from "@/lib/i18n-field";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { HeroSlideForm } from "@/components/admin/HeroSlideForm";

export const metadata: Metadata = { title: "Новый слайд" };

export default async function NewHeroSlidePage() {
  await requireAdmin();

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <PageShell>
      <PageHeader
        title="Новый слайд"
        back={{ href: "/admin/carousel-products", label: "К карусели" }}
      />
      <HeroSlideForm
        values={{
          isActive: true,
          overlayColor: "#1e140f",
          overlayOpacity: 65,
          productWidth: "42%",
        }}
        products={products.map((p) => ({ id: p.id, label: pick(p.name, "ru") }))}
      />
    </PageShell>
  );
}
