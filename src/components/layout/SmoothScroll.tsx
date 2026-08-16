"use client";
import { useEffect } from "react";
import Lenis from "lenis";

/** Shared handle so modals/drawers can stop Lenis while they're open, then
 *  resume the smooth-scroll animation when they close. */
export const lenisRef: { current: Lenis | null } = { current: null };

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.15,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    let raf: number;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return null;
}
