import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BlurImage } from "@/components/ui/BlurImage";

export function HomeOfficeFormat() {
  const t = useTranslations("home.office");
  return (
    <section className="container-x section-pt">
      <div className="flex flex-col gap-5 md:flex-row md:gap-6">
        {/* Proportion, not pixels. The banner was 708×549 fixed, which
         * only fitted inside the 1512px design frame — below that it
         * overflowed the row. It now keeps that design ratio and takes
         * half the row, so it scales with the container at any width. */}
        <div className="relative aspect-[17/10] w-full shrink-0 overflow-hidden rounded-2xl md:aspect-[708/549] md:w-1/2 md:rounded-3xl">
          <BlurImage
            src="/sections/home/home-office-banner.jpg"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-3 md:min-w-0 md:flex-1 md:gap-3.5">
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

          {/* Measure, not a pixel width: 509px was the design's line
           * length at 1512px only. `ch` tracks the font size, so the
           * column stays readable as the type scale changes. */}
          <div className="flex flex-col gap-3 md:max-w-[52ch] md:gap-4">
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
