import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import { FAQ } from "@/components/sections/FAQ";
import { ContactForm } from "@/components/sections/ContactForm";
import { Phone, Mail, MessageCircle, MapPin } from "lucide-react";
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

function ContactRow({
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

function ContactsBlock() {
  const t = useTranslations("contacts.contact");
  return (
    <section id="contacts" className="mx-auto w-full max-w-378 px-9 pt-20">
      <div className="w-full border-t border-[#dfdfdf] pt-10">
        <div className="flex items-start justify-between gap-35.25">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6">
              <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[96px] leading-[97%] tracking-[-0.035em]">
                {t("title")}
              </h2>
              <p className="max-w-146.5 text-xl leading-[130%] text-[#1a1a1a]">
                {t("subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-16 gap-y-10">
              <ContactRow label={t("socialsLabel")}>
                <a
                  href="https://instagram.com/nesilcoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity"
                >
                  <InstagramIcon className="h-5 w-5" />
                  @nesilcoffee
                </a>
                <a
                  href="https://tiktok.com/@nesilcoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity"
                >
                  <TikTokIcon className="h-5 w-5" />
                  @nesilcoffee
                </a>
              </ContactRow>

              <ContactRow label={t("phoneLabel")}>
                <a
                  href="tel:+99313732969"
                  className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity"
                >
                  <Phone className="h-5 w-5" />
                  +993 137 32969
                </a>
                <a
                  href="tel:+99313732973"
                  className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity"
                >
                  <Phone className="h-5 w-5" />
                  +993 137 32973
                </a>
              </ContactRow>

              <ContactRow label={t("messengerLabel")}>
                <a
                  href="https://wa.me/99313732969"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp
                </a>
                <a
                  href="mailto:info@nesilcoffee.com"
                  className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity"
                >
                  <Mail className="h-5 w-5" />
                  info@nesilcoffee.com
                </a>
              </ContactRow>

              <ContactRow label={t("addressLabel")}>
                <p className="inline-flex items-start gap-2 leading-[130%]">
                  <MapPin className="h-5 w-5 mt-1 shrink-0" />
                  <span>{t("address")}</span>
                </p>
              </ContactRow>
            </div>
          </div>

          <div className="flex w-146.5 flex-col gap-6 rounded-3xl bg-[#fbfbfb] p-8">
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
