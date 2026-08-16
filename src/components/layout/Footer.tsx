import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { InstagramIcon, TikTokIcon } from "@/components/icons/Socials";

const NAV = [
  { key: "home", href: "/" as const, bold: true },
  { key: "products", href: "/products" as const, bold: false },
  { key: "about", href: "/about" as const, bold: false },
  { key: "contacts", href: "/contacts" as const, bold: false },
];

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="w-full bg-paper-dark text-ink-inverse">
      <div className="fluid-desktop flex w-full flex-col gap-6 px-5 py-8 md:gap-5 md:pl-9 md:pr-7.5 md:py-10">
        <Image
          src="/sections/footer-icon.png"
          alt=""
          width={60}
          height={58}
          aria-hidden
          className="h-10 w-10 object-contain md:h-14.5 md:w-15"
        />

        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-35.25">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-68.25">
            <div className="flex flex-col gap-8 md:w-113.25 md:flex-row md:items-start md:justify-between md:gap-53.25">
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
                  <div className="flex flex-col text-sm font-normal text-ink-inverse md:text-lg">
                    <a
                      href="tel:+99313732969"
                      className="hover:opacity-80 transition-opacity"
                    >
                      +993 137 32969
                    </a>
                    <a
                      href="tel:+99313732973"
                      className="hover:opacity-80 transition-opacity"
                    >
                      +993 137 32973
                    </a>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="text-sm font-bold text-ink-inverse md:text-lg">
                    {t("footer.emailLabel").toUpperCase()}
                  </div>
                  <a
                    href="mailto:info@nesilcoffee.com"
                    className="text-sm font-normal text-ink-inverse hover:opacity-80 transition-opacity md:text-lg"
                  >
                    info@nesilcoffee.com
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:w-59.75 md:gap-5.25">
              <div className="text-sm font-bold text-ink-inverse md:text-lg">
                {t("footer.addressLabel").toUpperCase()}
              </div>
              <p className="text-sm font-normal leading-[130%] text-ink-inverse md:text-lg">
                {t("contacts.contact.address")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:w-45 md:gap-5.25">
            <div className="text-sm font-bold text-ink-inverse md:text-lg">
              {t("footer.socialsLabel").toUpperCase()}
            </div>
            <div className="flex flex-col gap-2.5 md:gap-3.25">
              <a
                href="https://tiktok.com/@nesilcoffee"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-normal text-ink-inverse hover:opacity-80 transition-opacity md:text-lg"
              >
                <TikTokIcon className="h-4 w-4 shrink-0 md:h-4.5 md:w-4.5" />
                @nesilcoffee
              </a>
              <a
                href="https://instagram.com/nesilcoffee"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-normal text-ink-inverse hover:opacity-80 transition-opacity md:text-lg"
              >
                <InstagramIcon className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
                @nesilcoffee
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
