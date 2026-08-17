import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, filledLocales, LOCALE_ORDER } from "@/lib/i18n-field";
import { PageShell, PageHeader, EmptyState, StatusDot, LocaleBadges } from "@/components/admin/ui";
import { RowActions } from "@/components/admin/RowActions";
import {
  toggleFaqItem,
  deleteFaqItem,
  restoreFaqItem,
  moveFaqItem,
} from "@/server/actions/content";

export const metadata: Metadata = { title: "Вопросы и ответы" };

export default async function FaqPage() {
  await requireAdmin();
  const items = await prisma.faqItem.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <PageShell>
      <PageHeader
        title="Вопросы и ответы"
        description="Аккордеон на странице контактов."
        action={{ href: "/admin/faq/new", label: "Добавить вопрос" }}
      />
      {items.length === 0 ? (
        <EmptyState message="Пока нет вопросов" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-paper">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center gap-2 text-sm font-medium text-ink">
                  <StatusDot active={item.isActive} />
                  <span className="truncate">{pick(item.question, "ru")}</span>
                </span>
                <span className="line-clamp-2 text-xs leading-relaxed text-ink-4">
                  {pick(item.answer, "ru")}
                </span>
              </div>
              <div className="hidden shrink-0 pt-0.5 sm:block">
                <LocaleBadges filled={filledLocales(item.answer)} all={LOCALE_ORDER} />
              </div>
              <div className="shrink-0">
                <RowActions
                  editHref={`/admin/faq/${item.id}`}
                  isActive={item.isActive}
                  canMoveUp={index > 0}
                  canMoveDown={index < items.length - 1}
                  onToggle={toggleFaqItem.bind(null, item.id)}
                  onMoveUp={moveFaqItem.bind(null, item.id, -1)}
                  onMoveDown={moveFaqItem.bind(null, item.id, 1)}
                  onDelete={deleteFaqItem.bind(null, item.id)}
                  onRestore={restoreFaqItem.bind(null, item.id)}
                  confirmLabel="Удалить?"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
