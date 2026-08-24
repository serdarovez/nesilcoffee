import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { toLocalized, pickList } from "@/lib/i18n-field";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata: Metadata = { title: "Настройки" };

export default async function SettingsPage() {
  await requireAdmin();

  const settings = await prisma.setting.findUnique({ where: { id: 1 } });

  return (
    <PageShell>
      <PageHeader
        title="Настройки"
        description="Контактные данные — используются в подвале, на странице контактов и в разметке для поисковых систем."
      />
      <SettingsForm
        values={{
          phones: pickList(settings?.phones),
          email: settings?.email ?? "info@nesilcoffee.com",
          address: settings ? toLocalized(settings.address) : undefined,
          whatsapp: settings?.whatsapp ?? null,
          contactWhatsapp: settings?.contactWhatsapp ?? null,
          telegram: settings?.telegram ?? null,
          instagram: settings?.instagram ?? null,
          tiktok: settings?.tiktok ?? null,
        }}
      />
    </PageShell>
  );
}
