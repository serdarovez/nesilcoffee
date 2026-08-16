"use client";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing, localeLabel, type Locale } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckLabel,
} from "@/components/ui/dropdown-menu";

const localeShort: Record<Locale, string> = {
  ru: "RU",
  en: "EN",
  tk: "TK",
  uz: "UZ",
  az: "AZ",
};

const localeFlag: Record<Locale, string> = {
  ru: "🇷🇺",
  en: "🇬🇧",
  tk: "🇹🇲",
  uz: "🇺🇿",
  az: "🇦🇿",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const change = (next: Locale) => {
    router.replace(pathname, { locale: next });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-full text-paper-dark cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
        <span
          aria-hidden
          className="inline-flex items-center justify-center h-4.5 w-4.5 rounded-full border border-line-strong text-[11px] leading-none overflow-hidden"
        >
          {localeFlag[locale]}
        </span>
        <span className="px-0.5 text-[18px] font-medium leading-[110%] font-sans">
          {localeShort[locale]}
        </span>
        <svg
          width="6"
          height="12"
          viewBox="0 0 6 12"
          fill="none"
          className="ml-0.5 shrink-0"
          aria-hidden
        >
          <path
            d="M1 4l2 2 2-2"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((l) => (
          <DropdownMenuItem key={l} onSelect={() => change(l)}>
            <DropdownMenuCheckLabel active={l === locale}>
              <span className="flex items-center gap-2">
                <span aria-hidden className="text-sm leading-none">
                  {localeFlag[l]}
                </span>
                <span className="text-xs font-bold text-muted-foreground w-6">
                  {localeShort[l]}
                </span>
                {localeLabel[l]}
              </span>
            </DropdownMenuCheckLabel>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
