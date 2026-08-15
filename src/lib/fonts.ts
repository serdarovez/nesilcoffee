import { Inter_Tight, Roboto_Condensed } from "next/font/google";

export const interTight = Inter_Tight({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const robotoCondensed = Roboto_Condensed({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "700"],
  variable: "--font-display",
  display: "swap",
});
