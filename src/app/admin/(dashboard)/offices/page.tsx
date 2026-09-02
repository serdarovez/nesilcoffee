import type { Metadata } from "next";
import Link from "next/link";
import { Globe, MapPin, Pencil } from "lucide-react";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { pick, pickList, filledLocales, LOCALE_ORDER } from "@/lib/i18n-field";
import { countryName } from "@/lib/countries";
import {
  PageShell,
  PageHeader,
  EmptyState,
  StatusDot,
  LocaleBadges,
} from "@/components/admin/ui";
import { RowActions } from "@/components/admin/RowActions";
import {
  toggleCountryContact,
  deleteCountryContact,
} from "@/server/actions/country-contacts";

export const metadata: Metadata = { title: "Офисы по странам" };

/**
 * Every address the site can show, on one screen.
 *
 * Head office is listed first and is not editable here — it lives in Settings,
 * because it is also the company's address in the footer and in the search
 * engine markup. It is shown anyway so this page answers the question an
 * editor actually has ("which address does a visitor get?") without them
 * having to hold two screens in their head.
 *
 * The offices themselves edit on their own page rather than inline. Inline
 * forms made the list as tall as the number of offices, which buried the
 * "add" button and left the impression that no more could be added.
 */
export default async function OfficesPage() {
  await requireAdmin();

  const [offices, settings] = await Promise.all([
    prisma.countryContact.findMany({ orderBy: { country: "asc" } }),
    prisma.setting.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Адреса"
        description="Посетитель видит адрес своей страны, если он здесь есть. Всем остальным показывается головной офис."
        action={{ href: "/admin/offices/new", label: "Добавить офис" }}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        {/* Head office: the fallback every visitor without a branch gets. */}
        <div className="flex items-start gap-3 border-b border-line bg-paper-alt px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              <Globe className="h-3.5 w-3.5 shrink-0 text-ink-3" />
              Головной офис
              <span className="rounded bg-paper px-1.5 py-0.5 text-[11px] font-normal text-ink-4">
                для всех остальных стран
              </span>
            </span>
            <span className="truncate text-xs text-ink-4">
              {settings ? pick(settings.address, "ru") : "Адрес не заполнен"}
            </span>
          </div>
          <Link
            href="/admin/settings"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:bg-paper hover:text-ink"
            aria-label="Изменить в настройках"
            title="Изменить в настройках"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </div>

        {offices.length === 0 ? (
          <EmptyState message="Других адресов пока нет — все посетители видят головной офис" />
        ) : (
          offices.map((office) => {
            const phones = pickList(office.phones);
            return (
              <div
                key={office.id}
                className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-center gap-2 text-sm font-medium text-ink">
                    <StatusDot active={office.isActive} />
                    <span className="truncate">{countryName(office.country)}</span>
                    <span className="shrink-0 font-mono text-[11px] text-ink-4">
                      {office.country}
                    </span>
                    {office.mapLat !== null && (
                      <MapPin
                        className="h-3 w-3 shrink-0 text-ink-4"
                        aria-label="Своя точка на карте"
                      />
                    )}
                  </span>
                  <span className="truncate text-xs text-ink-4">
                    {pick(office.address, "ru")}
                  </span>
                  <span className="truncate text-xs text-ink-4">
                    {phones.length
                      ? phones.join(", ")
                      : "Телефоны — из «Настроек»"}
                  </span>
                </div>
                <div className="hidden shrink-0 pt-0.5 sm:block">
                  <LocaleBadges
                    filled={filledLocales(office.address)}
                    all={LOCALE_ORDER}
                  />
                </div>
                <div className="shrink-0">
                  <RowActions
                    editHref={`/admin/offices/${office.id}`}
                    isActive={office.isActive}
                    hideMove
                    onToggle={toggleCountryContact.bind(null, office.id)}
                    onDelete={deleteCountryContact.bind(null, office.id)}
                    confirmLabel="Удалить адрес?"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </PageShell>
  );
}
