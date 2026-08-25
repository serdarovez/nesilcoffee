"use client";
import { useEffect, useRef, useState } from "react";

/**
 * A background video that downloads nothing until it is about to enter view.
 *
 * The section videos (home "searched", about "welcome") sit well below the
 * fold but were `autoPlay`, so the browser fetched several megabytes on first
 * paint even though the visitor might never scroll to them. This mounts the
 * `<video>` — and therefore starts any download — only once an
 * IntersectionObserver reports the placeholder is within `rootMargin` of the
 * viewport. Before that the parent's own background colour shows through.
 *
 * Not for the hero video, which is above the fold and should load eagerly.
 */
export function LazyVideo({
  src,
  poster,
  className = "absolute inset-0 h-full w-full object-cover",
  rootMargin = "400px",
}: {
  src: string;
  poster?: string;
  className?: string;
  /** How far before entering view to begin loading. */
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} className="absolute inset-0">
      {visible && (
        <video
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className={className}
        />
      )}
    </div>
  );
}
