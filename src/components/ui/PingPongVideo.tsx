"use client";
import { useEffect, useRef } from "react";

/**
 * A muted background video that boomerangs: it plays forward, then runs
 * backward, then forward again — with no hard cut back to frame 0 the way a
 * plain `loop` produces.
 *
 * Reverse playback is done by stepping `currentTime` backward in real time on
 * each animation frame, because browsers do not support a negative
 * `playbackRate`. How smooth the reverse looks depends on how often the source
 * is keyframed: a clip re-encoded with frequent keyframes reverses cleanly,
 * one with sparse keyframes can stutter as the decoder seeks. For a
 * guaranteed-smooth result, pre-render a forward+reverse file with ffmpeg (see
 * the note in SearchedForCoffee.tsx) and play it with a plain looping <video>
 * instead — this component is the no-re-encode option.
 */
export function PingPongVideo({
  src,
  poster,
  className = "absolute inset-0 h-full w-full object-cover",
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // We drive the loop ourselves, so the native one must be off.
    video.loop = false;

    let raf = 0;
    let last = 0;

    const reverse = (now: number) => {
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      const next = video.currentTime - dt;
      if (next <= 0.02) {
        // Reached the start — resume forward playback.
        video.currentTime = 0;
        last = 0;
        void video.play();
        return;
      }
      video.currentTime = next;
      raf = requestAnimationFrame(reverse);
    };

    const onEnded = () => {
      // Reached the end — start stepping backward.
      last = 0;
      raf = requestAnimationFrame(reverse);
    };

    video.addEventListener("ended", onEnded);
    void video.play().catch(() => {
      /* autoplay can be blocked until interaction; the poster stays up */
    });

    return () => {
      video.removeEventListener("ended", onEnded);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      playsInline
      preload="auto"
      className={className}
    />
  );
}
