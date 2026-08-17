import type { Metadata } from "next";
import {
  Coffee,
  FolderTree,
  Users,
  HelpCircle,
  Award,
  Inbox,
  GalleryHorizontal,
  ImageIcon,
} from "lucide-react";
import { requireAdmin } from "@/server/auth/guard";
import { prisma } from "@/server/db";

export const metadata: Metadata = { title: "Панель" };

/** Counts exclude soft-deleted rows so the numbers match what the site shows. */
async function getCounts() {
  const live = { deletedAt: null };

  const [
    products,
    categories,
    team,
    faq,
    certificates,
    homeSlides,
    heroSlides,
    media,
    submissions,
  ] = await Promise.all([
    prisma.product.count({ where: live }),
    prisma.category.count({ where: live }),
    prisma.teamMember.count({ where: live }),
    prisma.faqItem.count({ where: live }),
    prisma.certificate.count({ where: live }),
    prisma.homeSlide.count(),
    prisma.productsHeroSlide.count(),
    prisma.media.count(),
    prisma.submission.count(),
  ]);

  return {
    products,
    categories,
    team,
    faq,
    certificates,
    slides: homeSlides + heroSlides,
    media,
    submissions,
  };
}

const TILES = [
  { key: "products", label: "Продукция", icon: Coffee },
  { key: "categories", label: "Категории", icon: FolderTree },
  { key: "slides", label: "Слайды каруселей", icon: GalleryHorizontal },
  { key: "team", label: "Команда", icon: Users },
  { key: "faq", label: "Вопросы и ответы", icon: HelpCircle },
  { key: "certificates", label: "Сертификаты", icon: Award },
  { key: "media", label: "Изображения", icon: ImageIcon },
  { key: "submissions", label: "Заявки", icon: Inbox },
] as const;

export default async function DashboardPage() {
  const user = await requireAdmin();
  const counts = await getCounts();

  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10 md:py-12">
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-tight text-ink md:text-4xl">
          {greeting}, {user.name}
        </h1>
        <p className="text-sm text-ink-3">
          Содержимое сайта, доступное для редактирования.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.key}
              className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4"
            >
              <Icon className="h-5 w-5 text-ink-4" />
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-3xl font-bold leading-none text-ink tabular-nums">
                  {counts[tile.key]}
                </span>
                <span className="text-xs text-ink-3">{tile.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <section className="mt-8 rounded-xl border border-line bg-paper p-5 md:p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">
          Что дальше
        </h2>
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-ink-2">
          Вход и защита разделов готовы. Разделы каталога, каруселей и содержимого
          появятся на следующих этапах — в меню слева они пока неактивны. Сайт
          продолжает работать на прежнем содержимом и переключится на базу данных
          после того, как редактирование будет готово.
        </p>
      </section>
    </div>
  );
}
