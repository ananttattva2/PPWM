"use client";
import { Toaster } from "sonner";
import { useComputedColorScheme } from "@mantine/core";
export default function ToastProvider() {
  const scheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  return (
    <Toaster
      theme={scheme}
      richColors
      closeButton
      position="top-right"
      toastOptions={{ style: { fontFamily: "Arial, sans-serif" } }}
    />
  );
}
