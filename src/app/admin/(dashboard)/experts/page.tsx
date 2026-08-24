import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { PageShell, PageHeader, EmptyState } from "@/components/admin/ui";
import { ExpertsForm } from "@/components/admin/ExpertsForm";
import type { LocalizedField } from "@/lib/i18n-field";

export const metadata: Metadata = { title: "Эксперты" };

export default async function ExpertsPage() {
  await requireAdmin();

  const [experts, settings] = await Promise.all([
    prisma.expert.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { photo: true },
    }),
    prisma.setting.findUnique({
      where: { id: 1 },
      select: { expertsTitle: true },
    }),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Эксперты"
        description="Две карточки в блоке «Наши эксперты» на странице «О нас». Их количество фиксировано — можно только редактировать."
      />

      {experts.length === 0 ? (
        // Only reachable on a database that has not been seeded: the rows are
        // created by prisma/seed.ts, not by this screen.
        <EmptyState message="Эксперты не найдены — выполните «npm run db:seed»" />
      ) : (
        <ExpertsForm
          title={(settings?.expertsTitle ?? null) as LocalizedField | null}
          experts={experts.map((e) => ({
            id: e.id,
            name: e.name as LocalizedField,
            role: e.role as LocalizedField,
            quote: e.quote as LocalizedField,
            photo: e.photo
              ? {
                  id: e.photo.id,
                  path: e.photo.path,
                  originalName: e.photo.originalName,
                  width: e.photo.width,
                  height: e.photo.height,
                  blurDataUrl: e.photo.blurDataUrl,
                  bytes: e.photo.bytes,
                }
              : null,
          }))}
        />
      )}
    </PageShell>
  );
}
