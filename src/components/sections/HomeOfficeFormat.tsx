import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BlurImage } from "@/components/ui/BlurImage";

export function HomeOfficeFormat() {
  const t = useTranslations("home.office");
  return (
    <section className="mx-auto w-full max-w-378 px-9 pt-32">
      <div className="flex gap-6">
        <div className="relative h-[549px] w-[708px] shrink-0 overflow-hidden rounded-3xl">
          <BlurImage
            src="/sections/home/home-office-banner.jpg"
            alt=""
            fill
            sizes="708px"
            className="object-cover"
          />
        </div>

        <div className="flex w-[618px] flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <span className="inline-flex w-fit items-center rounded-lg bg-[#fbfbfb] p-2 text-lg font-bold text-black leading-[110%]">
              {t("pill")}
            </span>
            <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[96px] leading-[97%] tracking-[-0.035em]">
              {t.rich("title", {
                a: (chunks) => <span className="text-[#d8d8d8]">{chunks}</span>,
              })}
            </h2>
          </div>

          <div className="flex w-127.25 flex-col gap-4">
            <p className="text-xl font-light leading-[130%] text-[#1a1a1a]">
              {t("body1")}
            </p>
            <p className="text-xl font-light leading-[130%] text-[#1a1a1a]">
              {t("body2")}
            </p>
            <Link
              href="/products"
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#1a1a1a] px-8 py-4 text-lg font-medium text-white leading-[110%] transition-colors hover:bg-[#2a1810]"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
