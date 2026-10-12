"use client";
import { MantineProvider, createTheme } from "@mantine/core";
import { HeroUIProvider } from "@heroui/react";
import { MotionConfig } from "motion/react";
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider
      theme={createTheme({
        primaryColor: "orange",
        fontFamily: "Arial, sans-serif",
        defaultRadius: "md",
      })}
    >
      <HeroUIProvider>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </HeroUIProvider>
    </MantineProvider>
  );
}
