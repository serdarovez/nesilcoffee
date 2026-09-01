import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";
import { toLocalized, pickList } from "@/lib/i18n-field";
import { PageShell, PageHeader, Card } from "@/components/admin/ui";
import { OfficeForm } from "@/components/admin/OfficeForm";
import { DeleteOfficeButton } from "@/components/admin/DeleteOfficeButton";

export const metadata: Metadata = { title: "Офисы по странам" };

/**
 * Branch offices, one card each plus an empty card to add another.
 *
 * Deliberately not the usual list-then-edit-page pattern: there will only ever
 * be a handful of these, and each is three fields. Making an editor click into
 * a separate page to change a phone number would cost more than it saves.
 */
export default async function OfficesPage() {
  await requireAdmin();

  const offices = await prisma.countryContact.findMany({
    orderBy: { country: "asc" },
  });

  return (
    <PageShell>
      <PageHeader
        title="Офисы по странам"
        description="Адрес и телефоны для посетителей из конкретной страны — определяется по IP. Для всех остальных показываются данные из «Настроек», их менять здесь не нужно."
      />

      <div className="flex flex-col gap-4">
        {offices.map((office) => (
          <Card key={office.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <span className="font-display text-lg font-bold uppercase tracking-tight text-ink">
                {office.country}
                {!office.isActive && (
                  <span className="ml-2 text-xs font-normal normal-case text-ink-4">
                    (скрыт)
                  </span>
                )}
              </span>
              <DeleteOfficeButton id={office.id} country={office.country} />
            </div>
            <OfficeForm
              values={{
                id: office.id,
                country: office.country,
                address: toLocalized(office.address),
                phones: pickList(office.phones),
                isActive: office.isActive,
              }}
            />
          </Card>
        ))}

        <Card className="flex flex-col gap-4">
          <div className="border-b border-line pb-3">
            <span className="font-display text-lg font-bold uppercase tracking-tight text-ink">
              Добавить офис
            </span>
          </div>
          <OfficeForm values={{}} />
        </Card>
      </div>
    </PageShell>
  );
}
