import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BlurImage } from "@/components/ui/BlurImage";

export function HomeOfficeFormat() {
  const t = useTranslations("home.office");
  return (
    <section className="mx-auto w-full max-w-378 px-5 pt-16 md:px-9 md:pt-32">
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
            <span className="eyebrow inline-flex w-fit items-center rounded-md bg-[#fbfbfb] px-2 py-1 text-black md:rounded-lg md:p-2">
              {t("pill")}
            </span>
            <h2 className="display-2 text-[#1a1a1a]">
              {t.rich("title", {
                a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
              })}
            </h2>
          </div>

          <div className="flex flex-col gap-3 md:w-127.25 md:gap-4">
            <p className="body-md text-[#1a1a1a]">
              {t("body1")}
            </p>
            <p className="body-md text-[#1a1a1a]">
              {t("body2")}
            </p>
            <Link
              href="/products"
              className="body-md mt-2 inline-flex w-full items-center justify-center rounded-lg bg-[#1a1a1a] px-8 py-3.5 font-medium text-white transition-colors hover:bg-[#2a1810] md:mt-0 md:py-4"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
