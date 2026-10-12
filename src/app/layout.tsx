import type { Metadata } from "next";
import "@mantine/core/styles.css";
import "./globals.css";
import Providers from "@/components/providers";
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
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
