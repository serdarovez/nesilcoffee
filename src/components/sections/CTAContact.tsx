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
    <section id="contact" className="mx-auto w-full max-w-378 px-9 pt-32 pb-32">
      <div className="flex items-start justify-between gap-18 rounded-3xl bg-[#fbfbfb] px-20.25 py-21">
        <h2 className="w-152.75 font-display font-bold uppercase text-[#1a1a1a] text-[128px] leading-[97%] tracking-[-0.04em]">
          {t("title")}
        </h2>

        <div className="flex w-148.75 flex-col gap-4">
          <p className="text-lg font-normal leading-[110%] text-[#1a1a1a]">
            {t("body")}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              // TODO wire to /api/contact
            }}
            className="flex w-136 flex-col gap-2"
          >
            <label className="relative flex items-center rounded-lg bg-white px-4 py-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={form("email")}
                className="w-full bg-transparent text-lg text-[#1a1a1a] placeholder:text-[#999ead] outline-none"
              />
              <Mail className="h-6 w-6 shrink-0 text-[#999ead]" />
            </label>

            <label className="relative flex items-start rounded-lg bg-white px-4 py-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={form("message")}
                rows={3}
                className="w-full resize-none bg-transparent text-lg text-[#1a1a1a] placeholder:text-[#999ead] outline-none"
              />
              <Mail className="h-6 w-6 shrink-0 text-[#999ead] opacity-0" />
            </label>

            <button
              type="submit"
              className="inline-flex w-52.5 items-center justify-center rounded-lg bg-[#848484] px-8 py-4 text-lg font-medium text-[#cdcdcd] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              {form("send")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
