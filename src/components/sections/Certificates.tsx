"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";

export type CertificateView = {
  id: string;
  name: string;
  description: string;
  image: string | null;
  blurDataUrl: string | null;
};

export function Certificates({ items }: { items: CertificateView[] }) {
  const t = useTranslations("home.certificates");
  const reduce = useReducedMotion();

  if (items.length === 0) return null;

  return (
    <motion.section
      initial={reduce ? undefined : { opacity: 0, y: 140 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="container-x section-pt"
    >
      <h2 className="display-2 text-ink">{t("title")}</h2>

      <div className="mt-6 flex flex-col gap-4 md:mt-[clamp(32px,6dvh,60px)] md:flex-row md:gap-[clamp(16px,2vw,30px)]">
        {items.map((c) => (
          <article
            key={c.id}
            className="surface-card flex gap-3 p-4 md:min-w-0 md:flex-1 md:gap-[clamp(12px,1.4vw,20px)] md:p-[clamp(16px,1.8vw,28px)]"
          >
            {/* Mobile thumb sized as a share of the card with the
              * certificate's own 235:332 ratio, instead of a fixed
              * 96x128 box. md+ was already height-driven and fluid. */}
            <div className="relative aspect-[235/332] w-[28%] shrink-0 overflow-hidden rounded-md bg-paper-mute md:h-[clamp(220px,42dvh,332px)] md:w-auto md:rounded-lg">
              {c.image && (
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 96px, 235px"
                  className="object-cover"
                  {...(c.blurDataUrl
                    ? { placeholder: "blur" as const, blurDataURL: c.blurDataUrl }
                    : {})}
                />
              )}
            </div>
            <div className="flex min-w-0 flex-col justify-between gap-2 py-1 md:flex-1 md:py-2">
              <h3 className="heading-1 whitespace-pre-line text-ink">{c.name}</h3>
              <p className="body-sm text-ink">{c.description}</p>
            </div>
          </article>
        ))}
      </div>
    </motion.section>
  );
}
