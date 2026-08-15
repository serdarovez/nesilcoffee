"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getBlurProps } from "@/lib/blur-data";

type Props = Omit<ImageProps, "src" | "placeholder" | "blurDataURL"> & {
  src: string;
};

export function BlurImage({ src, className, ...props }: Props) {
  const [loaded, setLoaded] = useState(false);
  const blur = getBlurProps(src);

  return (
    <Image
      {...props}
      {...blur}
      src={src}
      onLoad={() => setLoaded(true)}
      className={cn(
        "transition-[filter,transform] duration-700 ease-out",
        loaded ? "blur-0 scale-100" : "blur-xl scale-[1.02]",
        className,
      )}
    />
  );
}
