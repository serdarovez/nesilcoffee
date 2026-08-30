"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { lenisRef } from "@/components/layout/SmoothScroll";

export type CertificateView = {
  id: string;
  name: string;
  description: string;
  image: string | null;
  blurDataUrl: string | null;
};

export function Certificates({ items }: { items: CertificateView[] }) {
  const t = useTranslations("home.certificates");
  const reduce = useReducedMotion();
  // The certificate currently shown full screen, or null. Holding the whole
  // record rather than an index keeps the viewer independent of list order.
  const [zoomed, setZoomed] = useState<CertificateView | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <motion.section
        initial={reduce ? undefined : { opacity: 0, y: 140 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="container-x section-pt"
      >
        <h2 className="display-2 text-ink">{t("title")}</h2>

        <div className="mt-6 flex flex-col gap-4 md:mt-[clamp(32px,6svh,60px)] md:flex-row md:gap-[clamp(16px,2vw,30px)]">
          {items.map((c) => (
            <article
              key={c.id}
              className="surface-card flex gap-3 p-4 md:min-w-0 md:flex-1 md:gap-[clamp(12px,1.4vw,20px)] md:p-[clamp(16px,1.8vw,28px)]"
            >
              {/* Mobile thumb sized as a share of the card with the
                * certificate's own 235:332 ratio, instead of a fixed
                * 96x128 box. md+ was already height-driven and fluid.
                *
                * A real <button> rather than a click handler on the div: the
                * certificate text is small on a phone and reading it is the
                * whole point, so opening it full screen has to be reachable by
                * keyboard and announced as an action, not just tappable. */}
              <button
                type="button"
                onClick={() => c.image && setZoomed(c)}
                disabled={!c.image}
                aria-label={`${c.name} — ${t("view")}`}
                className="group relative aspect-[235/332] w-[28%] shrink-0 cursor-pointer overflow-hidden rounded-md bg-paper-mute disabled:cursor-default md:h-[clamp(220px,42svh,332px)] md:w-auto md:rounded-lg"
              >
                {c.image && (
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 96px, 235px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    {...(c.blurDataUrl
                      ? { placeholder: "blur" as const, blurDataURL: c.blurDataUrl }
                      : {})}
                  />
                )}
              </button>
              <div className="flex min-w-0 flex-col justify-between gap-2 py-1 md:flex-1 md:py-2">
                <h3 className="heading-1 whitespace-pre-line text-ink">{c.name}</h3>
                <p className="body-sm text-ink">{c.description}</p>
              </div>
            </article>
          ))}
        </div>
      </motion.section>

      <CertificateViewer
        certificate={zoomed}
        onClose={() => setZoomed(null)}
        closeLabel={t("close")}
      />
    </>
  );
}

/**
 * Full-screen certificate viewer.
 *
 * A certificate is a dense A4 scan: at thumbnail size none of it is legible,
 * so the point of opening it is to actually read the text. The image is
 * therefore `object-contain` against the full viewport — the whole page is
 * shown, never cropped, at whatever size the screen allows.
 */
function CertificateViewer({
  certificate,
  onClose,
  closeLabel,
}: {
  certificate: CertificateView | null;
  onClose: () => void;
  closeLabel: string;
}) {
  const reduce = useReducedMotion();
  const open = certificate !== null;

  // Escape closes, matching OrderModal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock page scroll while open. Lenis runs its own RAF loop and ignores
  // `overflow: hidden`, so it has to be stopped explicitly — same as OrderModal.
  useEffect(() => {
    if (!open) return;
    const lenis = lenisRef.current;
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      lenis?.start();
    };
  }, [open]);

  // Clicking the backdrop closes; clicking the image itself must not, so the
  // image stops the event rather than the backdrop testing the target.
  const stop = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  return (
    <AnimatePresence>
      {certificate && certificate.image && (
        <motion.div
          initial={reduce ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={certificate.name}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 md:p-8"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute right-4 top-4 z-10 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 md:right-6 md:top-6"
          >
            <X className="h-6 w-6" strokeWidth={1.75} />
          </button>

          {/* `relative` + `fill` needs a sized box; the flex parent gives it
            * the viewport minus padding, and object-contain fits the scan
            * inside it whatever its aspect ratio. */}
          <motion.div
            initial={reduce ? undefined : { scale: 0.96 }}
            animate={{ scale: 1 }}
            exit={reduce ? undefined : { scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={stop}
            className="relative h-full w-full"
          >
            <Image
              src={certificate.image}
              alt={certificate.name}
              fill
              sizes="100vw"
              quality={90}
              priority
              className="object-contain"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
