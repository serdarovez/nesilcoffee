import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("nav");
  return (
    <section className="container-page py-24 lg:py-32 flex flex-col items-center text-center gap-6">
      <h1 className="text-7xl lg:text-9xl font-extrabold tracking-tight text-brand-espresso">
        404
      </h1>
      <p className="text-muted-foreground max-w-md">
        The page you are looking for could not be found.
      </p>
      <Button asChild variant="dark">
        <Link href="/">{t("home")}</Link>
      </Button>
    </section>
  );
}
