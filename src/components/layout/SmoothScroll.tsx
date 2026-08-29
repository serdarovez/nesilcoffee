"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname } from "@/i18n/navigation";

/** Shared handle so modals/drawers can stop Lenis while they're open, then
 *  resume the smooth-scroll animation when they close. */
export const lenisRef: { current: Lenis | null } = { current: null };

export function SmoothScroll() {
  // Locale-stripped: /ru/products and /en/products are the same page, so
  // switching language does not trigger the reset below. Keeping the reader's
  // place there is finished off in LanguageSwitcher, which passes
  // `scroll: false` — without it Next would scroll to top on its own.
  const pathname = usePathname();

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.15,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    // The browser restores the previous offset on reload and on back/forward,
    // which lands the visitor halfway down a page they are arriving at. Lenis
    // makes it worse: the restore happens before its first frame, so the page
    // also jumps. Positioning is handled explicitly below instead.
    const prevRestoration = history.scrollRestoration;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    let raf: number;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if ("scrollRestoration" in history) history.scrollRestoration = prevRestoration;
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Start every page at the top.
  //
  // Next already scrolls to top on navigation, but Lenis holds its own scroll
  // position and writes it back to the window on its next frame — so the new
  // page reappears at the offset the previous one was left at. Lenis has to be
  // moved too, and `immediate` skips the easing so it is a cut, not a visible
  // scroll back up through the whole page.
  useEffect(() => {
    // A link to an anchor asks for a specific position — don't fight it.
    if (window.location.hash) return;
    lenisRef.current?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
