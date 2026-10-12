"use client";
import { MantineProvider, createTheme, InputWrapper } from "@mantine/core";
import { HeroUIProvider } from "@heroui/react";
import { MotionConfig } from "motion/react";
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider
      defaultColorScheme="light"
      theme={createTheme({
        primaryColor: "orange",
        fontFamily: "Arial, sans-serif",
        defaultRadius: "md",
        components: {
          InputWrapper: InputWrapper.extend({
            defaultProps: {
              inputWrapperOrder: ["label", "input", "description", "error"],
            },
          }),
        },
      })}
    >
      <HeroUIProvider>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </HeroUIProvider>
    </MantineProvider>
  );
}
