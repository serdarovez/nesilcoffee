"use client";
import { useEffect, useRef, useState } from "react";

/**
 * A background video that downloads nothing until it is about to enter view,
 * and stops decoding once it leaves.
 *
 * Two separate jobs, and they need two observers:
 *
 *  - Loading. The section videos sit well below the fold but were `autoPlay`,
 *    so the browser fetched several megabytes on first paint even though the
 *    visitor might never scroll to them. The `<video>` — and therefore the
 *    download — is mounted only once the placeholder comes within `rootMargin`.
 *
 *  - Playing. A muted looping video keeps decoding frames for as long as it is
 *    playing, whether or not anyone can see it. Scrolling past three sections
 *    to the footer used to leave every video on the page still running, and the
 *    cost is constant and cumulative — which is what made scrolling feel heavy
 *    the further down the page you got, worst on phones. The second observer
 *    pauses on exit and resumes on re-entry.
 *
 * `eager` skips the loading gate for the hero, which is above the fold and must
 * not wait for an observer — but it still gets the pause-when-hidden behaviour.
 */
export function LazyVideo({
  src,
  sources,
  poster,
  className = "absolute inset-0 h-full w-full object-cover",
  rootMargin = "400px",
  eager = false,
}: {
  src?: string;
  /** Several encodings; the browser plays the first it can. Used by the About
   *  page, which ships a pre-rendered boomerang with a plain clip behind it. */
  sources?: string[];
  poster?: string;
  className?: string;
  /** How far before entering view to begin loading. */
  rootMargin?: string;
  /** Mount immediately instead of waiting to approach the viewport. */
  eager?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(eager);

  // Gate 1 — mount (and so begin downloading) when near the viewport.
  useEffect(() => {
    const el = ref.current;
    if (!el || mounted) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted, rootMargin]);

  // Gate 2 — play only while actually on screen. This observer is deliberately
  // NOT disconnected on first hit: it has to keep firing for the whole life of
  // the page so the video pauses again every time it scrolls away.
  useEffect(() => {
    const el = ref.current;
    if (!el || !mounted) return;
    const observer = new IntersectionObserver(([entry]) => {
      const video = videoRef.current;
      if (!video) return;
      if (entry.isIntersecting) {
        // Autoplay can be refused (low power mode, a user gesture policy);
        // there is nothing to do about it and it must not throw.
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

  return (
    <div ref={ref} className="absolute inset-0">
      {mounted && (
        <video
          ref={videoRef}
          {...(src ? { src } : {})}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload={eager ? "metadata" : "auto"}
          className={className}
        >
          {sources?.map((s) => (
            <source key={s} src={s} type="video/mp4" />
          ))}
        </video>
      )}
    </div>
  );
}
