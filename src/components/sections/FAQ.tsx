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
    <section className="mx-auto w-full max-w-378 px-5 pt-8 md:px-9 md:pt-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <h1 className="font-display font-bold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em] md:w-146.5 md:text-[96px] md:leading-[97%] md:tracking-[-0.035em]">
          {t.rich("title", {
            a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
          })}
        </h1>
        <div className="w-full md:w-207.5">
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
