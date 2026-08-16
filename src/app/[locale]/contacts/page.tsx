import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import { FAQ } from "@/components/sections/FAQ";
import { ContactForm } from "@/components/sections/ContactForm";
import { InstagramIcon, TikTokIcon } from "@/components/icons/Socials";
import { BlurImage } from "@/components/ui/BlurImage";

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
    <div className="flex flex-col gap-2 md:gap-3">
      <div className="text-xs font-bold uppercase tracking-wide text-[#a6a4a4] md:text-sm">
        {label}
      </div>
      <div className="flex flex-col gap-1.5 text-sm text-[#1a1a1a] md:gap-2 md:text-lg">
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
    <section id="contacts" className="mx-auto w-full max-w-378 px-5 pt-12 md:px-9 md:pt-20">
      <div className="border-t border-[#dfdfdf] pt-6 md:pt-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-35.25">
          <div className="flex flex-col gap-6 md:flex-1 md:gap-10">
            <div className="flex flex-col gap-3 md:gap-4">
              <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em] md:text-[96px] md:leading-[97%] md:tracking-[-0.035em]">
                {t("title")}
              </h2>
              <p className="text-sm leading-[140%] text-[#1a1a1a] md:max-w-146.5 md:text-xl md:leading-[130%]">
                {t("subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:max-w-146.5 md:gap-x-16 md:gap-y-10">
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

              <InfoBlock label={t("addressLabel")}>
                <p className="leading-[130%]">{t("address")}</p>
              </InfoBlock>

              <InfoBlock label={t("messengerLabel")}>
                <a
                  href="https://wa.me/99313732969"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity"
                >
                  <InstagramIcon className="h-4 w-4 md:h-5 md:w-5" />
                  +993 137 32969
                </a>
                <a
                  href="mailto:info@nesilcoffee.com"
                  className="hover:opacity-75 transition-opacity"
                >
                  info@nesilcoffee.com
                </a>
              </InfoBlock>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-4 rounded-2xl bg-[#fbfbfb] p-5 md:w-146.5 md:gap-6 md:rounded-3xl md:p-8">
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-2xl font-bold uppercase text-[#1a1a1a] leading-[100%] md:text-4xl">
                {t("writeUs")}
              </h3>
              <p className="text-sm text-[#444444] md:text-base">{t("writeUsBody")}</p>
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
    <section className="mx-auto w-full max-w-378 px-5 pt-8 pb-12 md:px-9 md:pt-10 md:pb-20">
      <div className="relative h-[220px] w-full overflow-hidden rounded-2xl md:h-126.25 md:rounded-3xl">
        <BlurImage
          src="/sections/contacts/map-banner.png"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 1440px"
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
