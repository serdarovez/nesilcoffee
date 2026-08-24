import type { Metadata } from "next";
import "./globals.css";
import { fontSans, fontDisplay } from "@/lib/fonts";

/**
 * 404 for URLs that match no route at all.
 *
 * Next skips normal rendering for this file, so it has to bring its own
 * document: global styles, fonts, and the <html>/<body> tags. That is precisely
 * why it exists here — neither root layout can be composed with the built-in
 * 404, because `[locale]/layout.tsx` is behind a dynamic segment and
 * `admin/layout.tsx` is a separate root.
 *
 * Localized 404s inside the site still come from `[locale]/not-found.tsx`;
 * this only catches what falls outside every tree.
 */
export const metadata: Metadata = {
  title: "404 — Страница не найдена",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html
      lang="ru"
      className={`${fontSans.variable} ${fontDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink">
        <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 text-center">
          <p className="font-display text-[clamp(72px,18vw,160px)] font-bold leading-none tracking-tight text-quiet">
            404
          </p>
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-2xl font-bold uppercase leading-none tracking-tight text-ink md:text-3xl">
              Страница не найдена
            </h1>
            <p className="max-w-sm text-sm text-ink-3">
              Возможно, ссылка устарела или в адресе опечатка.
            </p>
          </div>
          {/* A plain anchor, not next/link: this page renders its own <html>
           * outside the app shell, so a client-side transition would have no
           * layout to navigate within. A full page load is the correct
           * behaviour here. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/ru"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-paper-dark px-8 text-base font-medium text-ink-inverse transition-colors hover:bg-brand-coffee"
          >
            На главную
          </a>
        </main>
      </body>
    </html>
  );
}
