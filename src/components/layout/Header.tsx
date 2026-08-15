"use client";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "home", href: "/" as const },
  { key: "products", href: "/products" as const },
  { key: "about", href: "/about" as const },
  { key: "contacts", href: "/contacts" as const },
];

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E9E9E9] bg-white/50 backdrop-blur-[20px]">
      <div className="mx-auto flex w-full max-w-378 items-center justify-between pl-8 pr-9 py-3 h-20.5">
        <div className="flex items-center gap-109">
          <Logo />
          <nav className="flex items-center gap-2.75">
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
                      ? "text-[#191919] font-extrabold border-b border-[#191919]"
                      : "text-[#848484] font-normal hover:text-[#191919]",
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
