import type { Metadata } from "next";
import Image from "next/image";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, filledLocales, LOCALE_ORDER } from "@/lib/i18n-field";
import { PageShell, PageHeader, EmptyState, StatusDot, LocaleBadges } from "@/components/admin/ui";
import { RowActions } from "@/components/admin/RowActions";
import {
  toggleCertificate,
  deleteCertificate,
  restoreCertificate,
  moveCertificate,
} from "@/server/actions/content";

export const metadata: Metadata = { title: "Сертификаты" };

export default async function CertificatesPage() {
  await requireAdmin();
  const items = await prisma.certificate.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { image: true },
  });

  return (
    <PageShell>
      <PageHeader
        title="Сертификаты"
        description="Показываются на главной, странице продукции и «О нас»."
        action={{ href: "/admin/certificates/new", label: "Добавить сертификат" }}
      />
      {items.length === 0 ? (
        <EmptyState message="Пока нет сертификатов" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-paper">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0"
            >
              <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-paper-alt">
                {item.image && (
                  <Image
                    src={item.image.path}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-medium text-ink">
                  <StatusDot active={item.isActive} />
                  <span className="truncate">
                    {pick(item.name, "ru").replace(/\n/g, " ")}
                  </span>
                </span>
                <span className="line-clamp-1 text-xs text-ink-4">
                  {pick(item.description, "ru")}
                </span>
              </div>
              <div className="hidden shrink-0 sm:block">
                <LocaleBadges
                  filled={filledLocales(item.description)}
                  all={LOCALE_ORDER}
                />
              </div>
              <RowActions
                editHref={`/admin/certificates/${item.id}`}
                isActive={item.isActive}
                canMoveUp={index > 0}
                canMoveDown={index < items.length - 1}
                onToggle={toggleCertificate.bind(null, item.id)}
                onMoveUp={moveCertificate.bind(null, item.id, -1)}
                onMoveDown={moveCertificate.bind(null, item.id, 1)}
                onDelete={deleteCertificate.bind(null, item.id)}
                onRestore={restoreCertificate.bind(null, item.id)}
                confirmLabel="Удалить?"
              />
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
