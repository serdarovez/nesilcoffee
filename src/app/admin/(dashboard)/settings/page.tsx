import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { toLocalized, pickList } from "@/lib/i18n-field";
import { Download } from "lucide-react";
import { PageShell, PageHeader, Card } from "@/components/admin/ui";
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

      {/* A plain link, not a fetch-and-save button: the response already
        * carries Content-Disposition, so the browser downloads it directly.
        * The file never passes through JavaScript memory, and a failure shows
        * as a readable message rather than a silently empty download. */}
      <Card className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-ink">Резервная копия</h2>
          <p className="text-xs text-ink-4">
            Скачивает весь сайт одним ZIP-архивом: базу данных — товары,
            категории, команда, эксперты, сертификаты, заявки, настройки — и все
            загруженные изображения. Пароли и ключи из .env в архив не входят.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
          * this is a file download, not a page. `next/link` would try to
          * client-side navigate to it, which cannot produce a saved file. */}
        <a
          href="/api/admin/backup"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-paper-dark px-4 py-2.5 text-sm font-medium text-ink-inverse transition-colors hover:bg-black"
        >
          <Download className="h-4 w-4" />
          Скачать резервную копию
        </a>
        <p className="text-xs text-ink-4">
          Копия создаётся в момент нажатия, поэтому всегда актуальна. Внутри
          архива — <code className="rounded bg-paper-alt px-1 py-0.5">database.sql</code>,
          папка <code className="rounded bg-paper-alt px-1 py-0.5">uploads/</code> и
          инструкция по восстановлению в{" "}
          <code className="rounded bg-paper-alt px-1 py-0.5">README.txt</code>.
        </p>
      </Card>
    </PageShell>
  );
}
