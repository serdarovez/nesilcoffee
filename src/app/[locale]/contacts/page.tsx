import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { FAQ } from "@/components/sections/FAQ";
import { ContactForm } from "@/components/sections/ContactForm";
import { WhatsAppIcon, TelegramIcon } from "@/components/icons/Socials";
import { getFaqItems } from "@/server/queries";
import {
  contactInfo,
  telHref,
  telegramHref,
  whatsappLabel,
  type ContactInfo,
} from "@/server/views";
import { pick } from "@/lib/i18n-field";

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
 *  Right col: "НАПИШИТЕ НАМ" form card (rounded-3xl, bg #fbfbfb, padding).
 *
 *  Phones, address and social links come from the settings row rather than
 *  being repeated here, in the footer and in the JSON-LD block.
 */
async function ContactsBlock({
  locale,
  info,
}: {
  locale: string;
  info: ContactInfo;
}) {
  const t = await getTranslations({ locale, namespace: "contacts.contact" });

  return (
    <section id="contacts" className="container-x pt-12 md:pt-20">
      <div className="border-t border-[#dfdfdf] pt-6 md:pt-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-[clamp(24px,4vw,80px)]">
          <div className="flex flex-col gap-6 md:min-w-0 md:flex-1 md:gap-10">
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Was a hardcoded 32px/96px in a literal hex. The shared
                * type scale already carries both, fluidly, and tracks the
                * ink token. */}
              <h2 className="display-2 text-ink">
                {t("title")}
              </h2>
              <p className="text-sm leading-[140%] text-[#1a1a1a] md:max-w-[58ch] md:text-xl md:leading-[130%]">
                {t("subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:max-w-[58ch] md:gap-x-16 md:gap-y-10">
              <InfoBlock label={t("phoneLabel")}>
                {info.phones.map((phone) => (
                  <a
                    key={phone}
                    href={telHref(phone)}
                    className="hover:opacity-75 transition-opacity"
                  >
                    {phone}
                  </a>
                ))}
              </InfoBlock>

              <InfoBlock label={t("socialsLabel")}>
                {info.instagram && (
                  <a
                    href={info.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75 transition-opacity"
                  >
                    Instagram
                  </a>
                )}
                {info.tiktok && (
                  <a
                    href={info.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75 transition-opacity"
                  >
                    TikTok
                  </a>
                )}
              </InfoBlock>

              <InfoBlock label={t("addressLabel")}>
                <p className="leading-[130%]">{info.address || t("address")}</p>
              </InfoBlock>

              {/* Messengers, then e-mail. The WhatsApp number here is the
               * one meant for display — the number that receives orders is a
               * separate setting and is never shown. */}
              <InfoBlock label={t("messengerLabel")}>
                {info.contactWhatsapp && (
                  <a
                    href={`https://wa.me/${info.contactWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity"
                  >
                    <WhatsAppIcon className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
                    {whatsappLabel(info.contactWhatsapp)}
                  </a>
                )}
                {info.telegram && (
                  <a
                    href={telegramHref(info.telegram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity"
                  >
                    <TelegramIcon className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
                    @{info.telegram}
                  </a>
                )}
                <a
                  href={`mailto:${info.email}`}
                  className="hover:opacity-75 transition-opacity"
                >
                  {info.email}
                </a>
              </InfoBlock>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-4 rounded-2xl bg-[#fbfbfb] p-5 md:w-[48%] md:max-w-146.5 md:gap-6 md:rounded-3xl md:p-8">
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-2xl font-bold uppercase text-[#1a1a1a] leading-[100%] md:text-4xl">
                {t("writeUs")}
              </h3>
              <p className="text-sm text-[#444444] md:text-base">
                {t("writeUsBody")}
              </p>
            </div>
            <ContactForm
              whatsapp={info.whatsapp}
              contactEmail={info.email}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Google's own id for the NESIL COFFEE listing (from the shared maps.app.goo.gl
 *  link). Embedding by `cid` spotlights the business marker with its name and
 *  info card, which a bare `q=lat,lng` embed does not do. */
const MAP_CID = "11155405956491020435";
const MAP_LAT_LNG = "37.8486686,58.566173";

/**
 * Map type the banner opens on.
 *
 *   m — roadmap (Google's default)   k — satellite, imagery only
 *   h — hybrid, imagery with labels  p — terrain
 *
 * Hybrid rather than plain satellite: it is what Google Maps itself shows when
 * you switch to "Satellite", and the roastery sits among unnamed fields where
 * the road and place labels are the only things telling a visitor where they
 * are. Swap to "k" for bare imagery.
 */
const MAP_TYPE = "h";

/** Close enough to read the plot, wide enough to show the road to it. */
const MAP_ZOOM = 17;

/** Turn-by-turn directions to the roastery, opened in the Maps app on mobile. */
const MAP_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  MAP_LAT_LNG,
)}`;

/**
 * Embed URL for the banner.
 *
 * The keyless `maps?…&output=embed` form, not the official Maps Embed API,
 * which would need a billable API key for the same result. `cid` keeps the
 * business card and its marker; `t` and `z` are what this function exists to
 * pin down, since without them Google picks a roadmap at its own zoom.
 */
function mapEmbedUrl(locale: string): string {
  const params = new URLSearchParams({
    cid: MAP_CID,
    hl: locale,
    t: MAP_TYPE,
    z: String(MAP_ZOOM),
    output: "embed",
  });
  return `https://www.google.com/maps?${params}`;
}

/** Map banner — live Google map in the Figma banner's frame (rounded-3xl,
 *  24px per Rectangle 518), with a floating button that hands the visitor off
 *  to real directions. Opens on satellite imagery at the roastery; `hl`
 *  follows the site locale so the labels match the rest of the page. */
function MapBanner({ locale, title, cta }: { locale: string; title: string; cta: string }) {
  return (
    <section className="container-x pt-8 pb-12 md:pt-10 md:pb-20">
      {/* Ratio, not a fixed 220px / 505px height. The banner keeps its
        * design proportion and derives its height from the width it is
        * actually given, so it works on any screen. */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl md:aspect-[1512/505] md:rounded-3xl">
        <iframe
          title={title}
          src={mapEmbedUrl(locale)}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
        <a
          href={MAP_DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 left-4 inline-flex h-11 items-center justify-center rounded-lg bg-[#1a1a1a] px-5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-black md:bottom-6 md:left-6 md:h-13 md:px-6 md:text-base"
        >
          {cta}
        </a>
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

  const [faqRows, info, t] = await Promise.all([
    getFaqItems(),
    contactInfo(locale),
    getTranslations({ locale, namespace: "contacts.contact" }),
  ]);

  const faq = faqRows.map((item) => ({
    id: item.id,
    question: pick(item.question, locale),
    answer: pick(item.answer, locale),
  }));

  return (
    <>
      <FAQ items={faq} />
      <ContactsBlock locale={locale} info={info} />
      <MapBanner
        locale={locale}
        title={t("mapTitle")}
        cta={t("directions")}
      />
    </>
  );
}
