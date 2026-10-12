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
test("packaging compliance section follows the reference on desktop and mobile", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  const section = page.locator("#platform");
  await expect(section.getByRole("heading", { level: 2 })).toContainText(
    "Without Digging Through Hundreds of Pages",
  );
  await expect(
    section.getByText("Systematically Approach the Data Chaos", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    section.getByText("Assess and Calculate", { exact: true }),
  ).toBeVisible();
  await expect(
    section.getByRole("heading", { name: "Report", exact: true }),
  ).toBeVisible();
  const image = section.getByRole("img", { name: /Recyclable packaging:/ });
  await expect
    .poll(() =>
      image.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);
  expect(
    (await request.get("/images/packaging-still-life.webp")).status(),
  ).toBe(200);
  await section.screenshot({
    path: "artifacts/packaging-compliance-desktop.png",
  });
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-mantine-color-scheme",
    "dark",
  );
  await section.screenshot({ path: "artifacts/packaging-compliance-dark.png" });
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await section.screenshot({
    path: "artifacts/packaging-compliance-mobile.png",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
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
