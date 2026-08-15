import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import { FAQ } from "@/components/sections/FAQ";
import { ContactForm } from "@/components/sections/ContactForm";
import { InstagramIcon, TikTokIcon } from "@/components/icons/Socials";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contacts.contact" });
  return { title: t("title") };
}

/** Info block — small caps label + stack of values below. Two per row on desktop. */
function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-bold uppercase tracking-wide text-[#a6a4a4]">
        {label}
      </div>
      <div className="flex flex-col gap-2 text-lg text-[#1a1a1a]">
        {children}
      </div>
    </div>
  );
}

/** Contacts middle section — Figma "contact" (2048:13034).
 *  Top: divider. Left col: title + subtitle + 2x2 info grid (socials/phone/messenger/address).
 *  Right col: "НАПИШИТЕ НАМ" form card (rounded-3xl, bg #fbfbfb, padding). */
function ContactsBlock() {
  const t = useTranslations("contacts.contact");
  return (
    <section id="contacts" className="mx-auto w-full max-w-378 px-9 pt-20">
      <div className="border-t border-[#dfdfdf] pt-10">
        <div className="flex items-start justify-between gap-35.25">
          {/* Left column */}
          <div className="flex flex-1 flex-col gap-10">
            <div className="flex flex-col gap-4">
              <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[96px] leading-[97%] tracking-[-0.035em]">
                {t("title")}
              </h2>
              <p className="max-w-146.5 text-xl leading-[130%] text-[#1a1a1a]">
                {t("subtitle")}
              </p>
            </div>

            <div className="grid max-w-146.5 grid-cols-2 gap-x-16 gap-y-10">
              <InfoBlock label={t("socialsLabel")}>
                <a
                  href="https://instagram.com/nesilcoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-75 transition-opacity"
                >
                  Instagram
                </a>
                <a
                  href="https://tiktok.com/@nesilcoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-75 transition-opacity"
                >
                  TikTok
                </a>
              </InfoBlock>

              <InfoBlock label={t("phoneLabel")}>
                <a
                  href="tel:+99313732969"
                  className="hover:opacity-75 transition-opacity"
                >
                  +993 137 32969
                </a>
                <a
                  href="tel:+99313732973"
                  className="hover:opacity-75 transition-opacity"
                >
                  +993 137 32973
                </a>
              </InfoBlock>

              <InfoBlock label={t("messengerLabel")}>
                <a
                  href="https://wa.me/99313732969"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity"
                >
                  <InstagramIcon className="h-5 w-5" />
                  +993 137 32969
                </a>
                <a
                  href="mailto:info@nesilcoffee.com"
                  className="hover:opacity-75 transition-opacity"
                >
                  info@nesilcoffee.com
                </a>
              </InfoBlock>

              <InfoBlock label={t("addressLabel")}>
                <p className="leading-[130%]">{t("address")}</p>
              </InfoBlock>
            </div>
          </div>

          {/* Right column — "НАПИШИТЕ НАМ" form card */}
          <div className="flex w-146.5 shrink-0 flex-col gap-6 rounded-3xl bg-[#fbfbfb] p-8">
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-4xl font-bold uppercase text-[#1a1a1a] leading-[100%]">
                {t("writeUs")}
              </h3>
              <p className="text-base text-[#444444]">{t("writeUsBody")}</p>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Map banner — full-width image with rounded-3xl (24px per Figma Rectangle 518). */
function MapBanner() {
  return (
    <section className="mx-auto w-full max-w-378 px-9 pt-10 pb-20">
      <div className="relative h-126.25 w-full overflow-hidden rounded-3xl">
        <Image
          src="/sections/contacts/map-banner.png"
          alt=""
          fill
          sizes="1440px"
          className="object-cover"
        />
      </div>
    </section>
  );
}

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <FAQ />
      <ContactsBlock />
      <MapBanner />
    </>
  );
}
