"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";

const CERTS = [
  { key: "iso", image: "/certificates/iso-9001.png" },
  { key: "halal", image: "/certificates/halal.png" },
] as const;

export function Certificates() {
  const t = useTranslations("home.certificates");
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? undefined : { opacity: 0, y: 140 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-378 px-5 pt-16 md:px-9 md:pt-32"
    >
      <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em] md:text-[96px] md:leading-[97%] md:tracking-[-0.035em]">
        {t("title")}
      </h2>

      <div className="mt-6 flex flex-col gap-4 md:mt-15 md:flex-row md:gap-7.5">
        {CERTS.map((c) => (
          <article
            key={c.key}
            className="flex gap-3 rounded-2xl bg-[#fbfbfb] p-4 md:w-175.5 md:gap-3.75 md:rounded-3xl md:p-6"
          >
            <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-md md:h-83 md:w-58.75 md:rounded-lg">
              <Image
                src={c.image}
                alt={t(`items.${c.key}.name`)}
                fill
                sizes="(max-width: 768px) 96px, 235px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-between gap-2 py-1 md:w-101 md:py-2">
              <h3 className="whitespace-pre-line text-sm font-semibold leading-[120%] text-[#1a1a1a] md:text-3xl">
                {t(`items.${c.key}.name`)}
              </h3>
              <p className="text-xs font-normal leading-[130%] text-[#1a1a1a] md:text-xl md:leading-[110%]">
                {t(`items.${c.key}.desc`)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </motion.section>
  );
}
