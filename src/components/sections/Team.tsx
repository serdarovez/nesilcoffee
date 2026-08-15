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
    <section id="team" className="mx-auto w-full max-w-378 px-9 pt-32">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[96px] leading-[97%] tracking-[-0.035em]">
          {t("title")}
        </h2>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous"
            className="grid h-12 w-12 place-items-center rounded-full bg-[#d8d8d8] text-[#1a1a1a] transition-colors hover:bg-[#c0c0c0] cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next"
            className="grid h-12 w-12 place-items-center rounded-full bg-[#141414] text-white transition-colors hover:bg-black cursor-pointer"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-10 overflow-hidden" ref={emblaRef}>
        <div className="flex gap-8">
          {members.map((m, i) => (
            <article
              key={i}
              className="flex flex-[0_0_438px] flex-col rounded-4xl bg-[#fbfbfb] p-6"
            >
              <div className="relative h-97.5 w-97.5 overflow-hidden rounded-3xl bg-[#dedede]">
                <Image
                  src={AVATAR}
                  alt={m.name}
                  fill
                  sizes="390px"
                  className="object-cover"
                />
              </div>
              <div className="mt-3.5 flex flex-col gap-2">
                <div className="text-[16px] font-bold uppercase text-[#a6a4a4]">
                  {m.role}
                </div>
                <div className="text-3xl font-bold uppercase text-[#1a1a1a]">
                  {m.name}
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-2 border-t border-[#d9d9d9] pt-4 text-lg font-normal uppercase text-[#a6a4a4]">
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
