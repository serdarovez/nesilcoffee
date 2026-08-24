import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Search } from "lucide-react";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { mediaUsage, usageTitle } from "@/server/media";
import { PageShell, PageHeader, EmptyState } from "@/components/admin/ui";
import { MediaDeleteButton } from "@/components/admin/MediaDeleteButton";

export const metadata: Metadata = { title: "Галерея" };

const PAGE_SIZE = 48;

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

/** Date *and* time: two versions of the same picture are usually minutes apart. */
const DATE_FORMAT = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type GallerySearch = { page?: string; q?: string; selected?: string };

/** Preserve the current page and query when following a thumbnail. */
function href(params: GallerySearch): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.page && params.page !== "1") search.set("page", params.page);
  if (params.selected) search.set("selected", params.selected);
  const qs = search.toString();
  return qs ? `/admin/gallery?${qs}` : "/admin/gallery";
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<GallerySearch>;
}) {
  await requireAdmin();
  const { page: rawPage, q: rawQuery, selected } = await searchParams;

  const query = rawQuery?.trim() || undefined;
  const page = Math.max(1, Number(rawPage ?? 1) || 1);

  // Matches either the stored filename or the original one the editor
  // uploaded — searching for "gold-light" should find it even though the file
  // on disk is named from randomBytes.
  const where = query
    ? {
        OR: [
          { path: { contains: query, mode: "insensitive" as const } },
          { originalName: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        path: true,
        originalName: true,
        width: true,
        height: true,
        blurDataUrl: true,
        bytes: true,
        createdAt: true,
      },
    }),
    prisma.media.count({ where }),
  ]);

  // The detail panel is rendered from a fresh read rather than from `items`:
  // the selection can point at an image on another page of the grid.
  const detail = selected
    ? await prisma.media.findUnique({
        where: { id: selected },
        select: {
          id: true,
          path: true,
          originalName: true,
          width: true,
          height: true,
          bytes: true,
          mimeType: true,
          createdAt: true,
        },
      })
    : null;
  const usage = detail ? await mediaUsage(detail.id) : [];

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageShell>
      <PageHeader
        title="Галерея"
        description="Все загруженные изображения. Нажмите на изображение, чтобы увидеть, где оно используется, и удалить его."
      />

      <form method="get" className="mb-4 flex gap-2">
        {/* The selection is intentionally not carried over: after a search the
         * previously selected image is usually not in the results. */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
          <input
            type="search"
            name="q"
            defaultValue={query ?? ""}
            placeholder="Поиск по имени файла"
            className="w-full rounded-lg border border-line-strong bg-paper py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center rounded-lg border border-line-strong px-4 text-sm text-ink-2 transition-colors hover:border-ink hover:text-ink"
        >
          Найти
        </button>
      </form>

      {total === 0 ? (
        <EmptyState
          message={
            query
              ? `Ничего не найдено по запросу «${query}»`
              : "Пока нет загруженных изображений"
          }
        />
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {items.map((m) => {
                const active = m.id === detail?.id;
                return (
                  <Link
                    key={m.id}
                    href={href({
                      q: query,
                      page: String(page),
                      // Clicking the open image closes the panel.
                      selected: active ? undefined : m.id,
                    })}
                    scroll={false}
                    title={m.originalName ?? m.path}
                    className={`group relative aspect-square overflow-hidden rounded-lg border-2 bg-paper-alt transition-colors ${
                      active
                        ? "border-ink"
                        : "border-transparent hover:border-line-strong"
                    }`}
                  >
                    <Image
                      src={m.path}
                      alt=""
                      fill
                      sizes="180px"
                      className="object-contain p-1"
                      {...(m.blurDataUrl
                        ? {
                            placeholder: "blur" as const,
                            blurDataURL: m.blurDataUrl,
                          }
                        : {})}
                    />
                    {/* Filename on hover — the whole point of storing it. */}
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {m.originalName ?? m.path.split("/").pop()}
                    </span>
                  </Link>
                );
              })}
            </div>

            {pageCount > 1 && (
              <nav className="mt-4 flex items-center justify-center gap-2 text-sm">
                <PageLink
                  disabled={page <= 1}
                  href={href({ q: query, page: String(page - 1) })}
                  label="Назад"
                />
                <span className="text-ink-4">
                  {page} из {pageCount}
                </span>
                <PageLink
                  disabled={page >= pageCount}
                  href={href({ q: query, page: String(page + 1) })}
                  label="Дальше"
                />
              </nav>
            )}
          </div>

          {detail && (
            <aside className="flex w-full shrink-0 flex-col gap-3 rounded-xl border border-line bg-paper p-4 lg:sticky lg:top-6 lg:w-80">
              {/* Checkerboard: these are transparent PNGs and WebPs, and a
               * lighter variant is invisible against a white panel — which is
               * exactly the comparison this screen exists for. */}
              <div
                className="relative aspect-square w-full overflow-hidden rounded-lg"
                style={{
                  backgroundColor: "#fff",
                  backgroundImage:
                    "linear-gradient(45deg,#e9e9e9 25%,transparent 25%),linear-gradient(-45deg,#e9e9e9 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e9e9e9 75%),linear-gradient(-45deg,transparent 75%,#e9e9e9 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
                }}
              >
                <Image
                  src={detail.path}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-contain p-2"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="break-all text-sm font-medium text-ink">
                  {detail.originalName ?? detail.path.split("/").pop()}
                </span>
                {detail.originalName && (
                  <span className="break-all text-[11px] text-ink-5">
                    {detail.path}
                  </span>
                )}
              </div>

              <dl className="flex flex-col gap-1 text-xs text-ink-3">
                <Row label="Загружено" value={DATE_FORMAT.format(detail.createdAt)} />
                <Row
                  label="Размер"
                  value={
                    detail.width && detail.height
                      ? `${detail.width}×${detail.height}`
                      : "—"
                  }
                />
                <Row label="Вес файла" value={formatBytes(detail.bytes)} />
                <Row label="Формат" value={detail.mimeType ?? "—"} />
              </dl>

              <div className="flex flex-col gap-1.5 border-t border-line pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-4">
                  Где используется
                </span>
                {usage.length === 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-4">
                    <ImageOff className="h-3.5 w-3.5 shrink-0" />
                    Нигде — можно удалить без последствий
                  </span>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {usage.map((u) => (
                      <li key={`${u.kind}-${u.id}`}>
                        <Link
                          href={u.href}
                          className="text-xs text-ink-2 underline underline-offset-2 hover:text-ink"
                        >
                          {usageTitle(u)}
                        </Link>
                        {u.disables && (
                          <span className="ml-1 text-[11px] text-danger">
                            — скроется при удалении
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-line pt-3">
                <MediaDeleteButton id={detail.id} usage={usage} />
              </div>
            </aside>
          )}
        </div>
      )}
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-4">{label}</dt>
      <dd className="truncate text-ink-2">{value}</dd>
    </div>
  );
}

function PageLink({
  disabled,
  href,
  label,
}: {
  disabled: boolean;
  href: string;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="rounded-lg px-3 py-1.5 text-ink-5">{label}</span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-ink-2 transition-colors hover:bg-paper-alt hover:text-ink"
    >
      {label}
    </Link>
  );
}
