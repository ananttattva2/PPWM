import type { Metadata } from "next";
import { ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";
import "./globals.css";
import "./workspace.css";
import "./themes.css";
import "./compliance-section.css";
import Providers from "@/components/providers";
import ToastProvider from "@/components/toast-provider";
export const metadata: Metadata = {
  title: {
    default: "ANANT TATTVA | Packaging compliance, simplified",
    template: "%s | ANANT TATTVA",
  },
  description:
    "A connected workspace for packaging data, client onboarding, and your sustainability team.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      {/* Browser extensions can add body attributes before React hydrates. */}
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}
