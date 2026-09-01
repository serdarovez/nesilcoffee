import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { InstagramIcon, TikTokIcon } from "@/components/icons/Socials";
import { contactInfo } from "@/server/views";
import { socialHandle } from "@/lib/contact-format";
import { OfficeAddress, OfficePhones } from "./OfficeDetails";

const NAV = [
  { key: "home", href: "/" as const, bold: true },
  { key: "products", href: "/products" as const, bold: false },
  { key: "about", href: "/about" as const, bold: false },
  { key: "contacts", href: "/contacts" as const, bold: false },
];

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });
  const info = await contactInfo(locale);

  return (
    <footer className="w-full bg-paper-dark text-ink-inverse">
      {/* Same container as every section, so the footer's left edge
       * lands on the site gutter. It previously carried its own
       * asymmetric padding (pl-9 / pr-7.5). */}
      <div className="container-x flex w-full flex-col gap-6 py-8 md:gap-5 md:py-10">
        <Image
          src="/sections/footer-icon.png"
          alt=""
          width={60}
          height={58}
          aria-hidden
          className="h-10 w-10 object-contain md:h-14.5 md:w-15"
        />

        {/* Four columns on one grid, replacing three nested flex rows
         * whose 141px / 273px / 213px gaps and 453px fixed width summed
         * to a 1286px hard minimum — that overflowed every viewport
         * narrower than the 1512px design frame. */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 md:items-start md:gap-x-[clamp(1.5rem,4vw,4.5rem)] md:gap-y-0">
          <nav className="flex flex-col gap-3 md:gap-4 md:pt-0.5">
                {NAV.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`text-sm leading-[110%] uppercase text-ink-inverse transition-opacity hover:opacity-80 md:text-lg ${
                      item.bold ? "font-extrabold" : "font-normal"
                    }`}
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                ))}
              </nav>

              <div className="flex flex-col gap-5 md:gap-7">
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-bold text-ink-inverse md:text-lg">
                    {t("footer.phoneLabel").toUpperCase()}
                  </div>
                  <OfficePhones
                    phones={info.phones}
                    className="flex flex-col text-sm font-normal text-ink-inverse md:text-lg"
                    linkClassName="hover:opacity-80 transition-opacity"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="text-sm font-bold text-ink-inverse md:text-lg">
                    {t("footer.emailLabel").toUpperCase()}
                  </div>
                  <a
                    href={`mailto:${info.email}`}
                    className="text-sm font-normal text-ink-inverse hover:opacity-80 transition-opacity md:text-lg"
                  >
                    {info.email}
                  </a>
                </div>
              </div>

          <div className="flex flex-col gap-3 md:gap-5.25">
              <div className="text-sm font-bold text-ink-inverse md:text-lg">
                {t("footer.addressLabel").toUpperCase()}
              </div>
              <OfficeAddress
                address={info.address || t("contacts.contact.address")}
                className="text-sm font-normal leading-[130%] text-ink-inverse md:text-lg"
              />
            </div>
          <div className="flex flex-col gap-3 md:gap-5.25">
            <div className="text-sm font-bold text-ink-inverse md:text-lg">
              {t("footer.socialsLabel").toUpperCase()}
            </div>
            <div className="flex flex-col gap-2.5 md:gap-3.25">
              {/* Instagram first, then TikTok — the order the contacts page
                * already used. The two were inconsistent with each other. */}
              {info.instagram && (
                <a
                  href={info.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-normal text-ink-inverse hover:opacity-80 transition-opacity md:text-lg"
                >
                  <InstagramIcon className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
                  {socialHandle(info.instagram)}
                </a>
              )}
              {info.tiktok && (
                <a
                  href={info.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-normal text-ink-inverse hover:opacity-80 transition-opacity md:text-lg"
                >
                  <TikTokIcon className="h-4 w-4 shrink-0 md:h-4.5 md:w-4.5" />
                  {socialHandle(info.tiktok)}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* CC BY 4.0 attribution for the DB-IP Lite country database that backs
          * first-visit language detection (src/server/geo.ts). The licence
          * requires a visible credit wherever the data is used; the footer is
          * site-wide, so this one line covers every page. Remove it only if the
          * GeoIP source is swapped for one that does not require attribution. */}
        <div className="text-xs hidden text-ink-inverse/50">
          IP Geolocation by{" "}
          <a
            href="https://db-ip.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors hover:text-ink-inverse/80"
          >
            DB-IP
          </a>
        </div>
      </div>
    </footer>
  );
}
