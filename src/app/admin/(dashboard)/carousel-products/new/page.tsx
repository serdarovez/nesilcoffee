import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/server/auth/guard";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { HeroSlideForm } from "@/components/admin/HeroSlideForm";
import { heroProductOptions } from "@/server/admin-options";

export const metadata: Metadata = { title: "Новый слайд" };

export default async function NewHeroSlidePage() {
  await requireAdmin();

  const [products, t] = await Promise.all([
    heroProductOptions(),
    getTranslations({ locale: "ru", namespace: "products" }),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Новый слайд"
        description="Выберите товар — заголовок, текст и изображение подставятся автоматически."
        back={{ href: "/admin/carousel-products", label: "К карусели" }}
      />
      <HeroSlideForm
        values={{
          isActive: true,
          overlayColor: "#1e140f",
          overlayOpacity: 65,
          productWidth: "42%",
        }}
        products={products}
        sharedDescription={t("cardDescription")}
      />
    </PageShell>
  );
}
