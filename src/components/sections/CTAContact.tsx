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
      className="mx-auto w-full max-w-378 px-5 pt-16 pb-16 md:px-9 md:pt-[clamp(64px,10dvh,128px)] md:pb-[clamp(64px,10dvh,128px)]"
    >
      <div className="flex flex-col gap-6 rounded-2xl bg-[#fbfbfb] p-6 md:flex-row md:items-start md:justify-between md:gap-[clamp(24px,4vw,72px)] md:rounded-3xl md:px-[clamp(32px,5vw,80px)] md:py-[clamp(40px,7dvh,84px)]">
        <h2 className="display-1 text-[#1a1a1a] md:min-w-0 md:flex-1">
          {t("title")}
        </h2>

        <div className="flex flex-col gap-4 md:min-w-0 md:flex-1">
          <p className="body-md text-[#1a1a1a]">
            {t("body")}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              // TODO wire to /api/contact
            }}
            className="flex w-full flex-col gap-2"
          >
            <label className="relative flex items-center rounded-lg bg-white px-4 py-3.5 md:py-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={form("email")}
                className="body-md w-full bg-transparent text-[#1a1a1a] placeholder:text-[#999ead] outline-none"
              />
              <Mail className="h-5 w-5 shrink-0 text-[#999ead] md:h-6 md:w-6" />
            </label>

            <label className="relative flex items-start rounded-lg bg-white px-4 py-3.5 md:py-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={form("message")}
                rows={3}
                className="body-md w-full resize-none bg-transparent text-[#1a1a1a] placeholder:text-[#999ead] outline-none"
              />
              <Mail className="h-5 w-5 shrink-0 text-[#999ead] opacity-0 md:h-6 md:w-6" />
            </label>

            <button
              type="submit"
              className="body-md mt-1 inline-flex w-full items-center justify-center rounded-lg bg-[#848484] px-8 py-3.5 font-medium text-[#cdcdcd] transition-colors hover:bg-[#1a1a1a] hover:text-white md:mt-0 md:w-[clamp(180px,15vw,210px)] md:py-4"
            >
              {form("send")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
