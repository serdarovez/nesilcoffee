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
    <footer className="w-full bg-[#191919] text-white">
      <div className="mx-auto flex w-full max-w-378 flex-col gap-5 pl-9 pr-7.5 py-10">
        <Image
          src="/sections/footer-icon.png"
          alt=""
          width={60}
          height={58}
          aria-hidden
          className="h-14.5 w-15 object-contain"
        />

        <div className="flex w-full items-start justify-between gap-35.25">
          <div className="flex items-start gap-68.25">
            <div className="flex w-113.25 items-start justify-between gap-53.25">
              <nav className="flex flex-col gap-4 pt-0.5">
                {NAV.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`text-lg leading-[110%] uppercase text-white transition-opacity hover:opacity-80 ${
                      item.bold ? "font-extrabold" : "font-normal"
                    }`}
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                ))}
              </nav>

              <div className="flex flex-col gap-7">
                <div className="flex flex-col gap-2">
                  <div className="text-lg font-bold text-white">
                    {t("footer.phoneLabel").toUpperCase()}
                  </div>
                  <div className="flex flex-col text-lg font-normal text-white">
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
                  <div className="text-lg font-bold text-white">
                    {t("footer.emailLabel").toUpperCase()}
                  </div>
                  <a
                    href="mailto:info@nesilcoffee.com"
                    className="text-lg font-normal text-white hover:opacity-80 transition-opacity"
                  >
                    info@nesilcoffee.com
                  </a>
                </div>
              </div>
            </div>

            <div className="flex w-59.75 flex-col gap-5.25">
              <div className="text-lg font-bold text-white">
                {t("footer.addressLabel").toUpperCase()}
              </div>
              <p className="text-lg font-normal leading-[130%] text-white">
                {t("contacts.contact.address")}
              </p>
            </div>
          </div>

          <div className="flex w-45 flex-col gap-5.25">
            <div className="text-lg font-bold text-white">
              {t("footer.socialsLabel").toUpperCase()}
            </div>
            <div className="flex flex-col gap-3.25">
              <a
                href="https://tiktok.com/@nesilcoffee"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-lg font-normal text-white hover:opacity-80 transition-opacity"
              >
                <TikTokIcon className="h-4.5 w-4.5 shrink-0" />
                @nesilcoffee
              </a>
              <a
                href="https://instagram.com/nesilcoffee"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-lg font-normal text-white hover:opacity-80 transition-opacity"
              >
                <InstagramIcon className="h-5 w-5 shrink-0" />
                @nesilcoffee
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
