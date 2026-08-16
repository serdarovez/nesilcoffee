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
    <section id="team" className="mx-auto w-full max-w-378 px-5 pt-16 md:px-9 md:pt-[clamp(64px,10dvh,128px)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="display-2 text-[#1a1a1a]">
          {t("title")}
        </h2>
        <div className="flex gap-2 md:gap-[clamp(10px,1vw,16px)]">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#d8d8d8] text-[#1a1a1a] transition-colors hover:bg-[#c0c0c0] cursor-pointer md:size-[clamp(40px,3.2vw,48px)]"
          >
            <ArrowLeft className="h-4 w-4 md:size-[clamp(16px,1.4vw,20px)]" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#141414] text-white transition-colors hover:bg-black cursor-pointer md:size-[clamp(40px,3.2vw,48px)]"
          >
            <ArrowRight className="h-4 w-4 md:size-[clamp(16px,1.4vw,20px)]" />
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden md:mt-[clamp(24px,4dvh,40px)]" ref={emblaRef}>
        <div className="flex gap-4 md:gap-[clamp(16px,2vw,32px)]">
          {members.map((m, i) => (
            <article
              key={i}
              className="flex flex-[0_0_100%] min-w-0 flex-col rounded-3xl bg-[#fbfbfb] p-4 md:flex-[0_0_clamp(320px,30vw,438px)] md:rounded-4xl md:p-[clamp(16px,1.8vw,24px)]"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#dedede] md:rounded-3xl">
                <Image
                  src={AVATAR}
                  alt={m.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 30vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-3 flex flex-col gap-1.5 md:mt-[clamp(10px,1.5dvh,14px)] md:gap-2">
                <div className="eyebrow text-[#a6a4a4]">
                  {m.role}
                </div>
                <div className="heading-1 text-[#1a1a1a]">
                  {m.name}
                </div>
              </div>
              <div className="body-sm mt-4 flex flex-col gap-2 border-t border-[#d9d9d9] pt-3 uppercase text-[#a6a4a4] md:mt-[clamp(16px,2.5dvh,24px)] md:pt-4">
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
