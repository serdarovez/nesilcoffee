import type { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  Phone,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
} from "lucide-react";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { PageShell, PageHeader, EmptyState } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Заявки" };

const PAGE_SIZE = 30;

type Filter = "all" | "order" | "contact" | "spam";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const filter = (params.type ?? "all") as Filter;
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const where =
    filter === "order"
      ? { type: "ORDER" as const, isSpam: false }
      : filter === "contact"
        ? { type: "CONTACT" as const, isSpam: false }
        : filter === "spam"
          ? { isSpam: true }
          : { isSpam: false };

  const [items, total, counts] = await Promise.all([
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.submission.count({ where }),
    prisma.submission.groupBy({
      by: ["type", "isSpam"],
      _count: { _all: true },
    }),
  ]);

  const countFor = (f: Filter) => {
    if (f === "spam") {
      return counts.filter((c) => c.isSpam).reduce((n, c) => n + c._count._all, 0);
    }
    return counts
      .filter(
        (c) =>
          !c.isSpam &&
          (f === "all" ||
            (f === "order" && c.type === "ORDER") ||
            (f === "contact" && c.type === "CONTACT")),
      )
      .reduce((n, c) => n + c._count._all, 0);
  };

  const TABS: { key: Filter; label: string }[] = [
    { key: "all", label: "Все" },
    { key: "order", label: "Заказы" },
    { key: "contact", label: "Сообщения" },
    { key: "spam", label: "Спам" },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Заявки"
        description="Все обращения с сайта. Записываются в базу до отправки уведомлений, поэтому ничего не теряется, даже если письмо не ушло."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-sm">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={
                tab.key === "all"
                  ? "/admin/submissions"
                  : `/admin/submissions?type=${tab.key}`
              }
              className={cn(
                "rounded-lg px-3 py-1.5 transition-colors",
                filter === tab.key
                  ? "bg-paper-dark font-medium text-ink-inverse"
                  : "bg-paper text-ink-2 hover:text-ink",
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60 tabular-nums">
                {countFor(tab.key)}
              </span>
            </Link>
          ))}
        </div>

        <a
          href={`/api/admin/submissions/export${filter !== "all" ? `?type=${filter}` : ""}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong px-3 text-sm text-ink-2 transition-colors hover:border-ink hover:text-ink"
        >
          <Download className="h-4 w-4" />
          Скачать CSV
        </a>
      </div>

      {items.length === 0 ? (
        <EmptyState
          message={filter === "spam" ? "Спама пока нет" : "Пока нет заявок"}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((s) => (
            <article
              key={s.id}
              className={cn(
                "rounded-xl border bg-paper p-4",
                s.isSpam ? "border-dashed border-line-strong opacity-70" : "border-line",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase",
                        s.type === "ORDER"
                          ? "bg-paper-dark text-ink-inverse"
                          : "bg-paper-alt text-ink-2",
                      )}
                    >
                      {s.type === "ORDER" ? (
                        <>
                          <Package className="h-3 w-3" />
                          Заказ
                        </>
                      ) : (
                        <>
                          <Mail className="h-3 w-3" />
                          Сообщение
                        </>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-ink">{s.name}</span>
                    {s.channel !== "FORM" && (
                      <span
                        title="Клиент продолжил в этом приложении"
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase",
                          s.channel === "WHATSAPP"
                            ? "bg-[#e7f8ed] text-[#128c3e]"
                            : "bg-paper-alt text-ink-2",
                        )}
                      >
                        {s.channel === "WHATSAPP" ? "через WhatsApp" : "через почту"}
                      </span>
                    )}
                    {s.isSpam && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#fbefe7] px-1.5 py-0.5 text-[11px] font-semibold uppercase text-[#8a4b2a]">
                        <AlertTriangle className="h-3 w-3" />
                        Похоже на спам
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
                    {s.phone && (
                      <a
                        href={`tel:${s.phone.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-1 hover:text-ink"
                      >
                        <Phone className="h-3 w-3" />
                        {s.phone}
                      </a>
                    )}
                    {s.email && (
                      <a
                        href={`mailto:${s.email}`}
                        className="inline-flex items-center gap-1 hover:text-ink"
                      >
                        <Mail className="h-3 w-3" />
                        {s.email}
                      </a>
                    )}
                    <span className="uppercase">{s.locale}</span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <time className="text-xs text-ink-4 tabular-nums">
                    {formatDate(s.createdAt)}
                  </time>
                  {!s.isSpam && (
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span
                        title={
                          s.notifiedEmail
                            ? "Письмо отправлено"
                            : (s.notifyError ?? "Письмо не отправлено")
                        }
                        className={cn(
                          "inline-flex items-center gap-0.5",
                          s.notifiedEmail ? "text-success" : "text-ink-4",
                        )}
                      >
                        {s.notifiedEmail ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        email
                      </span>
                      <span
                        title={
                          s.notifiedWhatsapp
                            ? "WhatsApp отправлен"
                            : "WhatsApp не отправлен"
                        }
                        className={cn(
                          "inline-flex items-center gap-0.5",
                          s.notifiedWhatsapp ? "text-success" : "text-ink-4",
                        )}
                      >
                        {s.notifiedWhatsapp ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        wa
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {(s.productName || s.subject) && (
                <p className="mt-2 text-sm text-ink-2">
                  {s.type === "ORDER" ? (
                    <>
                      <span className="font-medium text-ink">{s.productName}</span>
                      {s.quantity ? ` × ${s.quantity}` : ""}
                    </>
                  ) : (
                    s.subject
                  )}
                </p>
              )}

              {s.message && (
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-paper-alt px-3 py-2 text-sm leading-relaxed text-ink-2">
                  {s.message}
                </p>
              )}

              {s.notifyError && !s.isSpam && (
                <p className="mt-2 text-xs text-[#8a4b2a]">
                  Уведомление не доставлено: {s.notifyError}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-ink-4">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} из {total}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/submissions?${new URLSearchParams({ ...(filter !== "all" ? { type: filter } : {}), page: String(page - 1) })}`}
                className="rounded-lg border border-line-strong px-3 py-1.5 text-ink-2 hover:border-ink hover:text-ink"
              >
                Назад
              </Link>
            )}
            {page * PAGE_SIZE < total && (
              <Link
                href={`/admin/submissions?${new URLSearchParams({ ...(filter !== "all" ? { type: filter } : {}), page: String(page + 1) })}`}
                className="rounded-lg border border-line-strong px-3 py-1.5 text-ink-2 hover:border-ink hover:text-ink"
              >
                Дальше
              </Link>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
