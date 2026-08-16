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
      className="mx-auto w-full max-w-378 px-9 pt-32"
    >
      <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[96px] leading-[97%] tracking-[-0.035em]">
        {t("title")}
      </h2>

      <div className="mt-15 flex gap-7.5">
        {CERTS.map((c) => (
          <article
            key={c.key}
            className="flex w-175.5 gap-3.75 rounded-3xl bg-[#fbfbfb] p-6"
          >
            <div className="relative h-83 w-58.75 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={c.image}
                alt={t(`items.${c.key}.name`)}
                fill
                sizes="235px"
                className="object-cover"
              />
            </div>
            <div className="flex w-101 flex-col justify-between py-2">
              <h3 className="text-3xl font-semibold leading-[120%] text-[#1a1a1a] whitespace-pre-line">
                {t(`items.${c.key}.name`)}
              </h3>
              <p className="text-xl font-normal leading-[110%] text-[#1a1a1a]">
                {t(`items.${c.key}.desc`)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </motion.section>
  );
}
