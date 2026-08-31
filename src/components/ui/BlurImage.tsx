"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { getBlurProps } from "@/lib/blur-data";

type Props = Omit<ImageProps, "src" | "placeholder" | "blurDataURL"> & {
  src: string;
};

// `alt` is pulled out and passed explicitly rather than riding along in the
// spread: it is required by ImageProps either way, but only a literal prop is
// visible to the jsx-a11y rule that enforces it.
export function BlurImage({ src, alt, className, ...props }: Props) {
  const [loaded, setLoaded] = useState(false);
  const blur = getBlurProps(src);

  /**
   * Clear the placeholder immediately for an image the browser already holds.
   *
   * `loaded` starts false on every mount, and a route change remounts
   * everything — so navigating back to a page the reader had already seen
   * played the whole blur-to-sharp reveal again on images that never left the
   * cache. It read as the site re-downloading its photographs on every page.
   *
   * A cached image is already `complete` by the time the element is attached,
   * and its `load` event may have fired before React wired `onLoad` up at all,
   * so waiting for that event is exactly the case this misses. A callback ref
   * runs on attach and can see the finished image; `onLoad` below still covers
   * the genuinely-loading case.
   */
  const settleIfCached = useCallback((img: HTMLImageElement | null) => {
    // naturalWidth guards against a `complete` that means "failed", which
    // would otherwise reveal a broken image with no placeholder behind it.
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <Image
      {...props}
      {...blur}
      src={src}
      alt={alt}
      ref={settleIfCached}
      onLoad={() => setLoaded(true)}
      className={cn(
        "transition-[filter,transform] duration-700 ease-out",
        loaded ? "blur-0 scale-100" : "blur-xl scale-[1.02]",
        className,
      )}
    />
  );
}
