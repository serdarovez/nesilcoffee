"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { InstagramIcon, TikTokIcon } from "@/components/icons/Socials";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "home", href: "/" as const },
  { key: "products", href: "/products" as const },
  { key: "about", href: "/about" as const },
  { key: "contacts", href: "/contacts" as const },
];

export function Header() {
  const t = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const tContacts = useTranslations("contacts.contact");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* The hairline is a shadow, not a border, so the header occupies
       * exactly `--site-header-h` and `--hero-h` lands on the fold. */}
      <header className="sticky top-0 z-40 w-full bg-white/50 shadow-[0_1px_0_var(--color-line)] backdrop-blur-[20px]">
        <div className="fluid-desktop flex h-(--site-header-h) w-full items-center justify-between px-5 md:pl-8 md:pr-9">
          <div className="flex items-center gap-6 md:gap-109">
            <Logo />
            <nav className="hidden items-center gap-2.75 md:flex">
              {NAV_ITEMS.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "px-0.5 py-0.5 text-[20px] leading-[110%] uppercase transition-colors",
                      active
                        ? "text-paper-dark font-extrabold border-b border-paper-dark"
                        : "text-ink-3 font-normal hover:text-paper-dark",
                    )}
                  >
                    {t(item.key)}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          {/* Mobile: hamburger */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid h-11 w-11 place-items-center text-ink md:hidden"
          >
            <Menu className="h-7 w-7" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-paper-dark text-ink-inverse transition-opacity duration-300 md:hidden",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-5 py-3">
          <div className="text-ink-inverse">
            <Logo />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid h-11 w-11 place-items-center text-ink-inverse"
          >
            <X className="h-7 w-7" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-5 pb-10 pt-4">
          <nav className="flex flex-col gap-4">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "text-3xl uppercase transition-opacity hover:opacity-80",
                    active ? "font-extrabold" : "font-medium",
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          <div className="h-px w-full bg-ink-inverse/15" />

          <div className="flex flex-col gap-6">
            <InfoBlock label={tFooter("phoneLabel")}>
              <a href="tel:+99313732969" className="block">
                +993 137 32969
              </a>
              <a href="tel:+99313732973" className="block">
                +993 137 32973
              </a>
            </InfoBlock>
            <InfoBlock label={tFooter("emailLabel")}>
              <a href="mailto:info@nesilcoffee.com">info@nesilcoffee.com</a>
            </InfoBlock>
            <InfoBlock label={tFooter("socialsLabel")}>
              <a
                href="https://instagram.com/nesilcoffee"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <InstagramIcon className="h-4 w-4" />
                @nesilcoffee
              </a>
              <a
                href="https://tiktok.com/@nesilcoffee"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <TikTokIcon className="h-4 w-4" />
                @nesilcoffee
              </a>
            </InfoBlock>
            <InfoBlock label={tFooter("addressLabel")}>
              <p className="leading-[130%]">{tContacts("address")}</p>
            </InfoBlock>
          </div>

          <div className="mt-auto">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </>
  );
}

function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-bold uppercase text-ink-inverse">{label}</div>
      <div className="flex flex-col gap-1 text-base font-normal text-ink-inverse">
        {children}
      </div>
    </div>
  );
}
