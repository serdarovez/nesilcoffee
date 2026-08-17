import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center", className)}
    >
      <Image
        src="/logo-mark.png"
        alt="NesilCoffee"
        width={34}
        height={32}
        preload
        className="h-14.5 w-17 object-contain"
      />
    </Link>
  );
}


