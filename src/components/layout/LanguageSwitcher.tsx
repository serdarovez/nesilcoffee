"use client";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing, localeLabel, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
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

/** Flag files rather than emoji: Windows ships no country-flag glyphs, so
 *  🇷🇺 renders as the bare "RU" regional-indicator letters there. */
const localeFlagSrc: Record<Locale, string> = {
  ru: "/flags/ru.svg",
  // US rather than GB: the copy is American English.
  en: "/flags/us.svg",
  tk: "/flags/tm.svg",
  uz: "/flags/uz.svg",
  az: "/flags/az.svg",
};

/** Round flag badge. Decorative — the adjacent code and language name carry
 *  the meaning, so the image stays out of the accessibility tree.
 *  `unoptimized` because the optimizer refuses SVG without `dangerouslyAllowSVG`,
 *  and a 20px vector has nothing to gain from it anyway. */
function Flag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-block shrink-0 overflow-hidden rounded-full border border-line-strong",
        className,
      )}
    >
      <Image
        src={localeFlagSrc[locale]}
        alt=""
        fill
        sizes="24px"
        className="object-cover"
        unoptimized
      />
    </span>
  );
}

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
        <Flag locale={locale} className="h-4.5 w-4.5" />
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
                <Flag locale={l} className="h-5 w-5" />
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
