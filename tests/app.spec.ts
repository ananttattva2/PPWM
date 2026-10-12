import { test, expect } from "@playwright/test";
test("landing page and mobile navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Less complexity.",
  );
  await expect(
    page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(1600);
  await page.screenshot({
    path: "artifacts/landing-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(
    page.getByRole("link", { name: "Our approach", exact: true }).first(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/landing-mobile.png",
    fullPage: true,
  });
});
test("OTP login and administrative portals", async ({ page }) => {
  for (const path of ["/login", "/admin/login", "/super-admin/login"]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Welcome back." }),
    ).toBeVisible();
    await expect(page.getByLabel("Work email")).toBeVisible();
  }
  await page.screenshot({ path: "artifacts/login.png", fullPage: true });
});
test("unauthenticated access is denied", async ({ page, request }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  for (const path of ["/api/clients", "/api/users"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(401);
  }
  const profile = await request.patch("/api/profile", {
    headers: { Origin: "http://localhost:3000" },
    data: { firstName: "Bad", lastName: "Actor", image: "" },
  });
  expect(profile.status()).toBe(401);
});
