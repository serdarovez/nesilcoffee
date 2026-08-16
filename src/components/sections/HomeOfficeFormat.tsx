import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BlurImage } from "@/components/ui/BlurImage";

export function HomeOfficeFormat() {
  const t = useTranslations("home.office");
  return (
    <section className="container-x section-pt">
      <div className="flex flex-col gap-5 md:flex-row md:gap-6">
        <div className="relative h-[220px] w-full shrink-0 overflow-hidden rounded-2xl md:h-[549px] md:w-[708px] md:rounded-3xl">
          <BlurImage
            src="/sections/home/home-office-banner.jpg"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 708px"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-3 md:w-[618px] md:gap-3.5">
          <div className="flex flex-col gap-2 md:gap-1">
            <span className="eyebrow inline-flex w-fit items-center rounded-md bg-paper-alt px-2 py-1 text-ink md:rounded-lg md:p-2">
              {t("pill")}
            </span>
            <h2 className="display-2 text-ink">
              {t.rich("title", {
                a: (chunks) => <span className="text-quiet">{chunks}</span>,
              })}
            </h2>
          </div>

          <div className="flex flex-col gap-3 md:w-127.25 md:gap-4">
            <p className="body-md text-ink">
              {t("body1")}
            </p>
            <p className="body-md text-ink">
              {t("body2")}
            </p>
            <Link
              href="/products"
              className="body-md mt-2 inline-flex w-full items-center justify-center rounded-lg bg-paper-dark px-8 py-3.5 font-medium text-ink-inverse transition-colors hover:bg-brand-coffee md:mt-0 md:w-fit md:py-4"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
