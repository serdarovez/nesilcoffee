"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { InstagramIcon, TikTokIcon } from "@/components/icons/Socials";
import type { ContactInfo } from "@/server/views";
import { socialHandle, telHref } from "@/lib/contact-format";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "home", href: "/" as const },
  { key: "products", href: "/products" as const },
  { key: "about", href: "/about" as const },
  { key: "contacts", href: "/contacts" as const },
];

/**
 * `info` comes from the settings row, the same source the footer and contacts
 * page read. The drawer used to hard-code the phone numbers, e-mail and social
 * handles, which had already drifted — it linked to a TikTok handle the
 * settings no longer used — and meant an edit in the admin never reached the
 * mobile menu at all.
 */
export function Header({ info }: { info: ContactInfo }) {
  const t = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const tContacts = useTranslations("contacts.contact");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // The drawer is closed by the links inside it (see `closeDrawer` below)
  // rather than by an effect watching `pathname`. Writing state from an effect
  // costs a second render pass and is what the react-hooks lint rule objects
  // to; it also missed the case of tapping the link for the page you are
  // already on, where the pathname never changes and the menu stayed open.

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
       * exactly `--site-header-h` and `--hero-h` lands on the fold.
       *
       * No backdrop-blur. This bar is sticky and spans the viewport, so a
       * backdrop filter made Chrome re-sample and re-blur everything behind it
       * on every scroll frame — on every page, which is what made scrolling
       * feel heavy. An opaque white reads almost identically over the pale
       * page and costs nothing to composite. */}
      {/* `fixed`, not `sticky`.
        *
        * A sticky bar is placed against the *layout* viewport. On iOS the
        * address bar collapses as you scroll down and expands as you scroll
        * back, resizing that viewport under the page — which left this header
        * scrolled roughly half out of sight until the reader went back up. It
        * measures perfectly in a desktop browser, where nothing resizes, which
        * is exactly why the earlier compositing-layer fix did not help.
        *
        * `fixed` is positioned against the visual viewport instead, so the bar
        * cannot be partly scrolled away whatever the browser chrome is doing.
        * The cost is that it no longer occupies space in the flow, which
        * `<main>` gives back with a matching `padding-top` — see
        * src/app/[locale]/layout.tsx. `--hero-h` is already
        * `100svh - --site-header-h`, so the first screen still ends exactly at
        * the fold.
        *
        * The mobile drawer below is a sibling, not a child, so it keeps
        * covering the whole viewport rather than being trapped in this bar. */}
      <header className="fixed inset-x-0 top-0 z-40 w-full bg-white/90 shadow-[0_1px_0_var(--color-line)]">
        {/* Same container as every section, so the logo's left edge sits
         * on the site gutter. The nav used to be pushed off the logo by a
         * fixed 436px gap (`md:gap-109`), which only centred it at the
         * 1512px design frame; it now centres in whatever space is left
         * between the logo and the language switcher. */}
        <div className="container-x flex h-(--site-header-h) w-full items-center gap-6">
          <Logo />
          <nav className="hidden flex-1 items-center justify-center gap-2.75 md:flex">
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
                      // Fluid rather than a flat 20px: the nav has to
                      // survive five locales, and Turkmen/Azeri labels
                      // are longer than the Russian the design was set in.
                      "px-0.5 py-0.5 text-[clamp(15px,1.3vw,20px)] leading-[110%] uppercase transition-colors",
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
          {/* Visible at every width, not just md+. On a phone this used to
            * live at the very bottom of the drawer, under the phone numbers,
            * e-mail, socials and address — so switching language meant opening
            * the menu and scrolling past everything to find a small flag. It
            * belongs in reach, beside the hamburger. `ml-auto` here so it and
            * the button sit together on the right once the desktop nav is
            * hidden. */}
          <div className="ml-auto md:ml-0">
            <LanguageSwitcher />
          </div>
          {/* Mobile: hamburger. */}
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
        <div className="flex items-center justify-between gutter-x py-3">
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

        <div className="flex flex-1 flex-col gap-8 overflow-y-auto gutter-x pb-10 pt-4">
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
                  onClick={() => setOpen(false)}
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
              {info.phones.map((phone) => (
                <a key={phone} href={telHref(phone)} className="block">
                  {phone}
                </a>
              ))}
            </InfoBlock>
            <InfoBlock label={tFooter("emailLabel")}>
              <a href={`mailto:${info.email}`}>{info.email}</a>
            </InfoBlock>
            <InfoBlock label={tFooter("socialsLabel")}>
              {info.instagram && (
                <a
                  href={info.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <InstagramIcon className="h-4 w-4" />
                  {socialHandle(info.instagram)}
                </a>
              )}
              {info.tiktok && (
                <a
                  href={info.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <TikTokIcon className="h-4 w-4" />
                  {socialHandle(info.tiktok)}
                </a>
              )}
            </InfoBlock>
            <InfoBlock label={tFooter("addressLabel")}>
              <p className="leading-[130%]">{tContacts("address")}</p>
            </InfoBlock>
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
