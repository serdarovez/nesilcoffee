import { Roboto_Condensed } from "next/font/google";

/**
 * One family in two roles.
 *
 * `--font-sans` carries body copy and `--font-display` the headings.
 * Both are Roboto Condensed — it replaced Inter Tight on the body side,
 * which is the only thing that used to differ.
 *
 * The two variables are kept rather than collapsed into one because the
 * type classes in globals.css are written against them, and because
 * putting a second family back on either role should not mean editing
 * every rule. They also carry different weight ranges: body copy uses
 * light through extrabold, headings only the three the design sets.
 *
 * Cyrillic subsets are not optional here — ru is the default locale and
 * tk/uz/az all render Cyrillic.
 *
 * The option objects are spelled out literally on purpose: next/font
 * reads them at build time and rejects anything it cannot statically
 * analyse, so a shared `SUBSETS` constant or a spread fails the build
 * while still typechecking cleanly.
 */

export const fontSans = Roboto_Condensed({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const fontDisplay = Roboto_Condensed({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "700"],
  variable: "--font-display",
  display: "swap",
});
