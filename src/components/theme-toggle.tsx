"use client";
import { useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { Sun, Moon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
export default function ThemeToggle() {
  const scheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const { setColorScheme } = useMantineColorScheme();
  const dark = scheme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setColorScheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={scheme}
          initial={{ rotate: -65, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 65, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.16 }}
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
