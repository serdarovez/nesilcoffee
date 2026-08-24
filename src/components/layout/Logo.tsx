import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center", className)}
    >
      {/* `w-auto`, not a fixed width. The box was 68px wide for a
       * 34x32 source, so `object-contain` fitted the art to the
       * height and left ~3px of transparent gutter on each side —
       * the mark's visual edge never coincided with its box edge,
       * and the header padding had been nudged to compensate.
       * Letting the intrinsic ratio set the width makes the two
       * the same, so aligning the box aligns what you can see. */}
      <Image
        src="/logo-mark.png"
        alt="NesilCoffee"
        width={34}
        height={32}
        priority
        className="h-14.5 w-auto"
      />
    </Link>
  );
}


