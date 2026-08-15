"use client";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "whileInView" | "transition"> {
  direction?: Direction;
  distance?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
}

const offsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 32 },
  down: { x: 0, y: -32 },
  left: { x: 32, y: 0 },
  right: { x: -32, y: 0 },
  none: { x: 0, y: 0 },
};

export const Reveal = forwardRef<HTMLDivElement, RevealProps>(function Reveal(
  {
    direction = "up",
    distance,
    delay = 0,
    duration = 0.7,
    once = true,
    amount = 0.2,
    children,
    ...props
  },
  ref,
) {
  const shouldReduce = useReducedMotion();
  const base = offsets[direction];
  const applied = distance
    ? { x: base.x ? Math.sign(base.x) * distance : 0, y: base.y ? Math.sign(base.y) * distance : 0 }
    : base;

  if (shouldReduce) {
    return (
      <motion.div ref={ref} {...props}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...applied }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
});
