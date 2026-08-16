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
    <section id="contact" className="container-x section-y">
      <div className="surface-card flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between md:gap-[clamp(24px,4vw,72px)] md:px-[clamp(32px,5vw,80px)] md:py-[clamp(40px,7dvh,84px)]">
        <h2 className="display-1 text-ink md:min-w-0 md:flex-1">
          {t("title")}
        </h2>

        <div className="flex flex-col gap-4 md:min-w-0 md:flex-1">
          <p className="body-md text-ink">
            {t("body")}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              // TODO wire to /api/contact
            }}
            className="flex w-full flex-col gap-2"
          >
            <label className="relative flex items-center rounded-lg bg-paper px-4 py-3.5 md:py-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={form("email")}
                className="body-md w-full bg-transparent text-ink placeholder:text-ink-placeholder outline-none"
              />
              <Mail className="h-5 w-5 shrink-0 text-ink-placeholder md:h-6 md:w-6" />
            </label>

            <label className="relative flex items-start rounded-lg bg-paper px-4 py-3.5 md:py-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={form("message")}
                rows={3}
                className="body-md w-full resize-none bg-transparent text-ink placeholder:text-ink-placeholder outline-none"
              />
              <Mail className="h-5 w-5 shrink-0 text-ink-placeholder opacity-0 md:h-6 md:w-6" />
            </label>

            <button
              type="submit"
              className="body-md mt-1 inline-flex w-full items-center justify-center rounded-lg bg-ink-3 px-8 py-3.5 font-medium text-ink-inverse-2 transition-colors hover:bg-paper-dark hover:text-ink-inverse md:mt-0 md:w-[clamp(180px,15vw,210px)] md:py-4"
            >
              {form("send")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
