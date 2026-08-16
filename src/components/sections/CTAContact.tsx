"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Mail } from "lucide-react";

export function CTAContact() {
  const t = useTranslations("home.cta");
  const form = useTranslations("form");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");

  return (
    <section
      id="contact"
      className="mx-auto w-full max-w-378 px-5 pt-16 pb-16 md:px-9 md:pt-32 md:pb-32"
    >
      <div className="flex flex-col gap-6 rounded-2xl bg-[#fbfbfb] p-6 md:flex-row md:items-start md:justify-between md:gap-18 md:rounded-3xl md:px-20.25 md:py-21">
        <h2 className="font-display font-bold uppercase text-[#1a1a1a] text-[32px] leading-[100%] tracking-[-0.03em] md:w-152.75 md:text-[128px] md:leading-[97%] md:tracking-[-0.04em]">
          {t("title")}
        </h2>

        <div className="flex flex-col gap-4 md:w-148.75">
          <p className="text-sm font-normal leading-[130%] text-[#1a1a1a] md:text-lg md:leading-[110%]">
            {t("body")}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              // TODO wire to /api/contact
            }}
            className="flex w-full flex-col gap-2 md:w-136"
          >
            <label className="relative flex items-center rounded-lg bg-white px-4 py-3.5 md:py-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={form("email")}
                className="w-full bg-transparent text-base text-[#1a1a1a] placeholder:text-[#999ead] outline-none md:text-lg"
              />
              <Mail className="h-5 w-5 shrink-0 text-[#999ead] md:h-6 md:w-6" />
            </label>

            <label className="relative flex items-start rounded-lg bg-white px-4 py-3.5 md:py-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={form("message")}
                rows={3}
                className="w-full resize-none bg-transparent text-base text-[#1a1a1a] placeholder:text-[#999ead] outline-none md:text-lg"
              />
              <Mail className="h-5 w-5 shrink-0 text-[#999ead] opacity-0 md:h-6 md:w-6" />
            </label>

            <button
              type="submit"
              className="mt-1 inline-flex w-full items-center justify-center rounded-lg bg-[#848484] px-8 py-3.5 text-base font-medium text-[#cdcdcd] transition-colors hover:bg-[#1a1a1a] hover:text-white md:mt-0 md:w-52.5 md:py-4 md:text-lg"
            >
              {form("send")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
