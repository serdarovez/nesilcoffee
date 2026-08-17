"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { cn } from "@/lib/utils";

export type QualityStepView = {
  key: string;
  image: string;
  title: string;
  body: string;
  /** Pre-composed "ЭТАП 01" label — the numbering is copy, not state. */
  stage: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/** Mobile-only reveal: the pinned rail is desktop territory. */
const cardVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Empty variants animate nothing, so `prefers-reduced-motion` renders the
 *  steps in their final state. */
const none: Variants = {};

/** Index of the last dot the filled rail has reached, or -1 before the first.
 *  The epsilon matters: a spring approaches its target asymptotically, so an
 *  exact comparison can leave the final dot permanently one hair short. */
function activeFromProgress(progress: number, marks: number[]) {
  let active = -1;
  for (let i = 0; i < marks.length; i++) {
    if (progress >= marks[i] - 0.002) active = i;
  }
  return active;
}

/**
 * Quality-control steps as a pinned stepper, on the same mechanic as
 * `ProductionProcess`: a runway one viewport tall per step, a `sticky`
 * viewport that pins for its duration, and stage content that cross-fades as
 * scroll advances. What differs is that the section keeps its timeline
 * identity — the ЭТАП rail stays on screen the whole time, its line filling
 * and its pills lighting as each step arrives, so the pinning reads as
 * progress through a list rather than as an unrelated carousel.
 *
 * Dot positions along the rail are measured rather than assumed: the rail lays
 * them out with `justify-between` inside a viewport-derived height, so their
 * fractions are only known at runtime.
 *
 * Desktop only. On mobile the steps stay a linear stack — a pinned
 * full-screen card cannot hold a step's image and its body copy at phone
 * width without overflowing.
 */
export function QualityTimeline({
  title,
  steps,
}: {
  title: ReactNode;
  steps: QualityStepView[];
}) {
  const reduce = useReducedMotion() ?? false;
  const runwayRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [marks, setMarks] = useState<number[]>([]);
  const [active, setActive] = useState(0);

  // 0 the moment the runway pins to the top of the viewport, 1 when it
  // releases — i.e. progress through the pinned sequence itself.
  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ["start start", "end end"],
  });

  // Each step owns one screen of the runway, but the dots are spread evenly
  // down the rail — two different scales. Map one onto the other piecewise so
  // the line arrives at dot i exactly as step i takes over; a straight linear
  // fill would only reach the last dot in the runway's final instant.
  const stepEdges = [...steps.map((_, i) => i / steps.length), 1];
  const dotTargets = marks.length === steps.length ? [...marks, 1] : stepEdges;
  const raw = useTransform(scrollYProgress, stepEdges, dotTargets);
  const fill = useSpring(raw, { stiffness: 140, damping: 30, mass: 0.4 });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const bounds = track.getBoundingClientRect();
      if (bounds.height === 0) return;

      const next = dotRefs.current.map((dot) => {
        if (!dot) return 0;
        const rect = dot.getBoundingClientRect();
        return (rect.top + rect.height / 2 - bounds.top) / bounds.height;
      });
      setMarks(next);
    };

    measure();
    // The rail is sized from the viewport, so anything that reflows it — a
    // resize, a late font swap — moves the dots.
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [steps.length]);

  useMotionValueEvent(fill, "change", (progress) => {
    // Never fall back past the first step: while pinned there is always one
    // stage on screen, and the rail is lit from its first dot.
    const next = Math.max(0, activeFromProgress(progress, marks));
    setActive((prev) => (prev === next ? prev : next));
  });

  const variants = reduce
    ? { card: none, item: none }
    : { card: cardVariants, item: itemVariants };

  return (
    <>
      {/* Mobile: linear stack. No pinning, no rail — the steps reveal as they
       * scroll into view and the pills stay in their solid state. */}
      <div className="md:hidden">
        <h2 className="display-2 text-ink">{title}</h2>
        <div className="mt-6 flex flex-col gap-8">
          {steps.map((step) => (
            <motion.article
              key={step.key}
              variants={variants.card}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              className="flex flex-col gap-4"
            >
              <motion.div
                variants={variants.item}
                className="eyebrow inline-flex w-fit items-center rounded-full bg-ink px-3 py-1.5 text-ink-inverse"
              >
                {step.stage}
              </motion.div>
              <motion.div
                variants={variants.item}
                className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-line-strong"
              >
                <Image
                  src={step.image}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </motion.div>
              <motion.h3 variants={variants.item} className="heading-1 text-ink">
                {step.title}
              </motion.h3>
              <motion.p variants={variants.item} className="body-md text-ink-2">
                {step.body}
              </motion.p>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Desktop: pinned runway — one viewport of scroll per step. */}
      <div
        ref={runwayRef}
        className="relative hidden md:block"
        style={{ height: `${steps.length * 100}dvh` }}
      >
        {/* `--screen-h` compensates for the outer .fluid-viewport zoom, so the
         * pinned card matches the real viewport height on md+. */}
        <div className="sticky top-0 flex h-(--screen-h) w-full flex-col overflow-hidden pt-[clamp(100px,14dvh,160px)] pb-[clamp(16px,3dvh,32px)]">
          <h2 className="display-2 shrink-0 text-ink md:max-w-[66.2%]">
            {title}
          </h2>

          <div className="mt-[clamp(24px,4dvh,40px)] flex min-h-0 flex-1 gap-[clamp(16px,2vw,24px)]">
            {/* Rail is 9% rather than the Figma 102px so the stage pill still
             * fits on one line once the label scales with the viewport. */}
            <div className="relative w-[9%] shrink-0">
              <div
                ref={trackRef}
                className="absolute left-2 top-5 bottom-5 w-0.5 overflow-hidden rounded-full bg-line-strong"
              >
                <motion.div
                  aria-hidden
                  className="h-full w-full origin-top bg-ink"
                  style={{ scaleY: reduce ? 1 : fill }}
                />
              </div>

              <div className="flex h-full flex-col justify-between">
                {steps.map((step, i) => {
                  const reached = i <= active;
                  return (
                    <div key={step.key} className="relative pl-8">
                      <span
                        ref={(el) => {
                          dotRefs.current[i] = el;
                        }}
                        className={cn(
                          "absolute left-1 top-3.5 h-3 w-3 rounded-full transition-[background-color,transform] duration-500 ease-out",
                          reached
                            ? "scale-100 bg-ink"
                            : "scale-75 bg-line-strong",
                        )}
                      />
                      <div
                        className={cn(
                          "eyebrow inline-flex h-10 items-center whitespace-nowrap rounded-full px-3 transition-colors duration-500 ease-out",
                          reached
                            ? "bg-ink text-ink-inverse"
                            : "bg-paper-warm text-ink-4",
                        )}
                      >
                        {step.stage}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage stack — all layered, cross-faded on scroll-driven change. */}
            <div className="relative min-w-0 flex-1">
              {steps.map((step, i) => (
                <div
                  key={step.key}
                  className={cn(
                    "absolute inset-0 transition-all duration-700 ease-out",
                    i === active
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none opacity-0",
                    i !== active && !reduce && "translate-y-4",
                  )}
                  aria-hidden={i !== active}
                >
                  <StageCard step={step} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** One pinned stage: the image takes the full pinned height on the left, the
 *  copy sits centred beside it — the section's original image-then-title-then-
 *  body order, scaled up to a full screen. */
function StageCard({ step }: { step: QualityStepView }) {
  return (
    <div className="flex h-full items-stretch gap-[clamp(24px,3vw,56px)]">
      <div className="relative h-full w-[34%] shrink-0 overflow-hidden bg-line-strong">
        <Image
          src={step.image}
          alt=""
          fill
          sizes="34vw"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-[clamp(14px,2dvh,24px)]">
        <h3 className="display-3 text-ink">{step.title}</h3>
        <p className="body-xl max-w-[52ch] text-ink-2">{step.body}</p>
      </div>
    </div>
  );
}
