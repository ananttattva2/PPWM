import fs from "node:fs/promises";
import { chromium } from "@playwright/test";
import { createOTPEmail } from "../src/lib/otp-email";
import { emailLogoBase64 } from "../src/lib/email-logo";
await fs.mkdir("artifacts", { recursive: true });
const html = createOTPEmail({
  email: "you@company.com",
  otp: "123456",
}).html.replace(
  "cid:anant-tattva-logo",
  `data:image/png;base64,${emailLogoBase64}`,
);
await fs.writeFile("artifacts/otp-email-preview.html", html);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 1100 },
  });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({
    path: "artifacts/otp-email-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/otp-email-mobile.png",
    fullPage: true,
  });
  if (
    !(await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ))
  )
    throw new Error("Email preview overflows mobile width");
  console.log(
    "OTP email desktop/mobile preview saved. Uses a dummy code; no email was sent.",
  );
} finally {
  await browser.close();
}
