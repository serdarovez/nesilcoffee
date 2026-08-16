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
            <span className="inline-flex w-fit items-center rounded-md bg-[#fbfbfb] px-2 py-1 text-xs font-bold text-black leading-[110%] md:rounded-lg md:p-2 md:text-lg">
              {t("pill")}
            </span>
            <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em] md:text-[96px] md:leading-[97%] md:tracking-[-0.035em]">
              {t.rich("title", {
                a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
              })}
            </h2>
          </div>

          <div className="flex flex-col gap-3 md:w-127.25 md:gap-4">
            <p className="text-sm font-light leading-[130%] text-[#1a1a1a] md:text-xl">
              {t("body1")}
            </p>
            <p className="text-sm font-light leading-[130%] text-[#1a1a1a] md:text-xl">
              {t("body2")}
            </p>
            <Link
              href="/products"
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-[#1a1a1a] px-8 py-3.5 text-base font-medium text-white leading-[110%] transition-colors hover:bg-[#2a1810] md:mt-0 md:py-4 md:text-lg"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
