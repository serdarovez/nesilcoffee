import type { Metadata } from "next";
import { fontSans, fontDisplay } from "@/lib/fonts";

/**
 * Shell for every /admin route.
 *
 * The app's root layout is a pass-through and `[locale]/layout.tsx` owns the
 * <html> element for the public site, so the admin has to render its own.
 *
 * Deliberately no auth guard here — /admin/login lives underneath this layout
 * and guarding at this level would redirect the login page to itself. The guard
 * sits in the (dashboard) route group instead.
 */
export const metadata: Metadata = {
  title: { default: "Админка", template: "%s — NesilCoffee" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${fontSans.variable} ${fontDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper-alt text-ink">{children}</body>
    </html>
  );
}
