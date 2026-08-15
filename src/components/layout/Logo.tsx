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
        src="/logo.png"
        alt="NesilCoffee"
        width={44}
        height={42}
        priority
        className="h-20.5 w-21 object-contain"
      />
    </Link>
  );
}
