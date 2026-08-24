"use client";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

/** `answer` is sanitized HTML — see sanitizeRichText() in src/server/form.ts. */
export type FaqEntry = { id: string; question: string; answer: string };

export function FAQ({ items }: { items: FaqEntry[] }) {
  const t = useTranslations("contacts.faq");

  if (items.length === 0) return null;

  return (
    <section className="container-x pt-8 md:pt-20">
      {/* Was a 586px + 830px pair of fixed columns — 1416px of hard
        * width that only fitted the design frame. Now a 2:3 split of
        * whatever the container gives it. The heading also used a
        * hardcoded 32px/96px instead of the shared type scale. */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-[clamp(24px,3vw,48px)]">
        <h2 className="display-2 text-ink md:flex-[0_0_40%]">
          {t.rich("title", {
            a: (chunks) => <span className="text-quiet">{chunks}</span>,
          })}
        </h2>
        <div className="w-full md:min-w-0 md:flex-1">
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {items.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>
                  {/* Safe by construction: the only writer is the admin form,
                   * which runs every value through the tag allowlist before it
                   * reaches the database. Nothing else can write this column. */}
                  <div
                    className="rich-text"
                    dangerouslySetInnerHTML={{ __html: item.answer }}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
