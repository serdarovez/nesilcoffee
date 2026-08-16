"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback } from "react";
import { ArrowLeft, ArrowRight, Phone, Mail } from "lucide-react";

const AVATAR = "/sections/team/adel-sakhieva.png";

export function Team() {
  const t = useTranslations("home.team");

  const members = t.raw("members") as {
    name: string;
    role: string;
    phone: string;
    email: string;
  }[];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section id="team" className="mx-auto w-full max-w-378 px-5 pt-16 md:px-9 md:pt-32">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em] md:text-[96px] md:leading-[97%] md:tracking-[-0.035em]">
          {t("title")}
        </h2>
        <div className="flex gap-2 md:gap-4">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#d8d8d8] text-[#1a1a1a] transition-colors hover:bg-[#c0c0c0] cursor-pointer md:h-12 md:w-12"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#141414] text-white transition-colors hover:bg-black cursor-pointer md:h-12 md:w-12"
          >
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden md:mt-10" ref={emblaRef}>
        <div className="flex gap-4 md:gap-8">
          {members.map((m, i) => (
            <article
              key={i}
              className="flex flex-[0_0_100%] min-w-0 flex-col rounded-3xl bg-[#fbfbfb] p-4 md:flex-[0_0_438px] md:rounded-4xl md:p-6"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#dedede] md:h-97.5 md:w-97.5 md:rounded-3xl">
                <Image
                  src={AVATAR}
                  alt={m.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 390px"
                  className="object-cover"
                />
              </div>
              <div className="mt-3 flex flex-col gap-1.5 md:mt-3.5 md:gap-2">
                <div className="text-xs font-bold uppercase text-[#a6a4a4] md:text-[16px]">
                  {m.role}
                </div>
                <div className="text-xl font-bold uppercase text-[#1a1a1a] md:text-3xl">
                  {m.name}
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 border-t border-[#d9d9d9] pt-3 text-sm font-normal uppercase text-[#a6a4a4] md:mt-6 md:pt-4 md:text-lg">
                <a
                  href={`tel:${m.phone}`}
                  className="inline-flex items-center gap-1.5 hover:text-[#1a1a1a] transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {m.phone}
                </a>
                <a
                  href={`mailto:${m.email}`}
                  className="inline-flex items-center gap-1.5 normal-case hover:text-[#1a1a1a] transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {m.email}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
