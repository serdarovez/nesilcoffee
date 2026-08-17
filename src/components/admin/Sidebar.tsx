"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Coffee,
  FolderTree,
  GalleryHorizontal,
  Images,
  Users,
  HelpCircle,
  Award,
  Inbox,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/admin/actions";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Coffee;
  /** Sections land in later phases; showing them greyed is honest about scope. */
  ready: boolean;
};

const NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Обзор",
    items: [
      { href: "/admin", label: "Панель", icon: LayoutDashboard, ready: true },
    ],
  },
  {
    heading: "Каталог",
    items: [
      { href: "/admin/products", label: "Продукция", icon: Coffee, ready: true },
      { href: "/admin/categories", label: "Категории", icon: FolderTree, ready: true },
    ],
  },
  {
    heading: "Карусели",
    items: [
      { href: "/admin/carousel-home", label: "Главная страница", icon: GalleryHorizontal, ready: true },
      { href: "/admin/carousel-products", label: "Страница продукции", icon: Images, ready: true },
    ],
  },
  {
    heading: "Содержимое",
    items: [
      { href: "/admin/team", label: "Команда", icon: Users, ready: true },
      { href: "/admin/faq", label: "Вопросы и ответы", icon: HelpCircle, ready: true },
      { href: "/admin/certificates", label: "Сертификаты", icon: Award, ready: true },
    ],
  },
  {
    heading: "Прочее",
    items: [
      { href: "/admin/submissions", label: "Заявки", icon: Inbox, ready: true },
      { href: "/admin/settings", label: "Настройки", icon: Settings, ready: true },
    ],
  },
];

export function Sidebar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname();

  return (
    /* `h-dvh` + `sticky` rather than plain flex stretch. As a bare flex child
     * the aside inherits the container's *content* height, so it scrolled away
     * on long pages and took the logout button with it. Pinning it to one
     * viewport also gives `nav`'s overflow-y-auto a bounded parent, without
     * which it could never scroll. `self-start` keeps align-items:stretch from
     * re-expanding it, which would leave sticky nothing to travel over. */
    <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col self-start border-r border-line bg-paper">
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
        <Image
          src="/logo-mark.png"
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
        />
        <div className="flex min-w-0 flex-col">
          <span className="font-display text-sm font-bold uppercase leading-tight text-ink">
            NesilCoffee
          </span>
          <span className="text-xs text-ink-4">Панель управления</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.heading} className="mb-5 last:mb-0">
            <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-4">
              {group.heading}
            </div>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                if (!item.ready) {
                  return (
                    <li key={item.href}>
                      <span
                        aria-disabled="true"
                        title="Появится в следующем этапе"
                        className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-5"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-paper-dark font-medium text-ink-inverse"
                          : "text-ink-2 hover:bg-paper-alt hover:text-ink",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <a
          href="/ru"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-2 transition-colors hover:bg-paper-alt hover:text-ink"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          Открыть сайт
        </a>

        <div className="flex items-center gap-2 rounded-lg bg-paper-alt px-2.5 py-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-dark text-xs font-semibold text-ink-inverse">
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-semibold text-ink">
              {userName}
            </span>
            <span className="truncate text-[11px] text-ink-4">{userEmail}</span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Выйти"
              aria-label="Выйти"
              className="grid h-7 w-7 cursor-pointer place-items-center rounded-md text-ink-3 transition-colors hover:bg-paper hover:text-danger"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
