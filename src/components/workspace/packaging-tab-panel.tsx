"use client";
import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
export default function PackagingTabPanel({
  active,
  id,
  labelledBy,
  children,
}: {
  active: boolean;
  id: string;
  labelledBy: string;
  children: ReactNode;
}) {
  const [present, setPresent] = useState(active);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (active) setPresent(true);
  }, [active]);
  return (
    <motion.div
      role="tabpanel"
      id={id}
      aria-labelledby={labelledBy}
      aria-hidden={!active}
      inert={!active}
      hidden={!active && !present}
      initial={false}
      animate={{ opacity: active ? 1 : 0, y: active || reduce ? 0 : 10 }}
      transition={{ duration: reduce ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (!active) setPresent(false);
      }}
      style={{
        position: active ? "relative" : "absolute",
        inset: active ? undefined : 0,
        width: "100%",
        pointerEvents: active ? "auto" : "none",
      }}
    >
      {children}
    </motion.div>
  );
}
