import { test, expect } from "@playwright/test";
import { MongoClient, ObjectId } from "mongodb";
import { createHash, randomUUID } from "node:crypto";
import { setServers } from "node:dns";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
if (process.env.MONGODB_DNS_SERVERS)
  setServers(process.env.MONGODB_DNS_SERVERS.split(","));
test("OTP verification, client onboarding, roles and profile persist", async ({
  page,
  request,
}) => {
  test.setTimeout(150000);
  const browserErrors: string[] = [];
  page.on("pageerror", (e) => browserErrors.push(e.message));
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);
  const id = new ObjectId();
  const email = `qa-${randomUUID()}@example.invalid`;
  const company = `QA-${randomUUID()}`;
  let createdUserEmail = "";
  const importIds: string[] = [];
  const otp = "739182";
  try {
    await db.collection("user").insertOne({
      _id: id,
      email,
      name: "QA Administrator",
      firstName: "QA",
      lastName: "Administrator",
      role: "super_admin",
      active: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // The mail transport is not exercised: seed a hashed, short-lived test OTP for an isolated test account.
    await db.collection("verification").insertOne({
      identifier: `sign-in-otp-${email}`,
      value: `${createHash("sha256").update(otp).digest("base64url")}:0`,
      expiresAt: new Date(Date.now() + 300000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const wrong = await request.post("/api/auth/sign-in/email-otp", {
      headers: { Origin: "http://localhost:3000" },
      data: { email, otp: "000000" },
    });
    expect(wrong.ok()).toBe(false);
    const signed = await page.request.post("/api/auth/sign-in/email-otp", {
      headers: { Origin: "http://localhost:3000" },
      data: { email, otp },
    });
    expect(signed.status(), await signed.text()).toBe(200);
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /Hello, QA/ }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Collapse sidebar", exact: true })
      .click();
    await expect(page.locator(".workspace")).toHaveClass(/sidebar-collapsed/);
    await page.waitForTimeout(350);
    expect((await page.locator(".sidebar").boundingBox())!.width).toBe(72);
    await expect(
      page.getByRole("link", { name: "Client onboarding", exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.locator(".workspace")).toHaveClass(/sidebar-collapsed/);
    await page
      .getByRole("button", { name: "Expand sidebar", exact: true })
      .click();
    await page.waitForTimeout(350);
    expect((await page.locator(".sidebar").boundingBox())!.width).toBe(216);
    await page.waitForTimeout(800);
    await page.screenshot({ path: "artifacts/dashboard.png", fullPage: true });
    await page
      .getByRole("link", { name: "Client onboarding", exact: true })
      .click();
    await page.getByRole("button", { name: "New client" }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByText("Please complete the required organisation details.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Upload at least one supporting document.", {
        exact: true,
      }),
    ).toBeVisible();
    const legalInput = page.getByRole("textbox", {
      name: "Legal name",
      exact: true,
    });
    await legalInput.focus();
    const legalField = page
      .locator(".floating-field")
      .filter({ has: legalInput });
    await expect(legalField).toHaveAttribute("data-focused", "true");
    await page
      .getByRole("textbox", { name: "Legal name", exact: true })
      .fill(company);
    await expect(legalField).toHaveAttribute("data-filled", "true");
    await page
      .getByRole("textbox", { name: "Authorised person", exact: true })
      .fill("QA Contact");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page
      .getByRole("textbox", { name: "Trade name", exact: true })
      .fill("QA Packaging");
    await page
      .getByRole("textbox", { name: "GST number", exact: true })
      .fill("27ABCDE1234F1Z5");
    await page
      .getByRole("textbox", { name: "Registration / user number", exact: true })
      .fill("QA-REG-001");
    await page
      .getByRole("textbox", { name: "Registered address", exact: true })
      .fill("12 Test Street, Mumbai, Maharashtra 400001");
    await page
      .getByRole("textbox", { name: "Telephone", exact: true })
      .fill("+91 98765 43210");
    await page
      .getByRole("combobox", { name: "Organisation role", exact: true })
      .click();
    for (const role of [
      "Producer",
      "Manufacturer",
      "Supplier",
      "Importer",
      "Distributor",
      "Final Distributor",
      "Fulfilment Service Provider",
      "Authorised Representative",
    ])
      await expect(
        page.getByRole("option", { name: role, exact: true }),
      ).toBeVisible();
    await page.getByRole("option", { name: "Producer", exact: true }).click();
    const fileBytes = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF",
    );
    await page
      .getByLabel("Supporting documents", { exact: true })
      .setInputFiles({
        name: "registration.pdf",
        mimeType: "application/pdf",
        buffer: fileBytes,
      });
    await expect(
      page.getByText("registration.pdf", { exact: true }),
    ).toBeVisible();
    const detailsBox = await page
      .getByRole("textbox", { name: "Legal name", exact: true })
      .boundingBox();
    const documentBox = await page.locator(".document-dropzone").boundingBox();
    expect(documentBox!.x).toBeGreaterThan(detailsBox!.x);
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeLessThan(1400);
    await page.evaluate(() => {
      document
        .querySelectorAll<HTMLButtonElement>("[data-close-button]")
        .forEach((b) => b.click());
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: "artifacts/client-onboarding.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Switch to dark mode", exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-mantine-color-scheme",
      "dark",
    );
    await page.waitForTimeout(350);
    await page.screenshot({
      path: "artifacts/client-onboarding-dark.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Collapse sidebar", exact: true })
      .click();
    await page.waitForTimeout(350);
    await page.screenshot({
      path: "artifacts/client-onboarding-dark-collapsed.png",
      fullPage: true,
    });
    const persisted = await page.context().newPage();
    await persisted.goto("/dashboard");
    await expect(persisted.locator("html")).toHaveAttribute(
      "data-mantine-color-scheme",
      "dark",
    );
    await expect(persisted.locator(".workspace")).toHaveClass(
      /sidebar-collapsed/,
    );
    await persisted.close();
    await page
      .getByRole("button", { name: "Expand sidebar", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Switch to light mode", exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-mantine-color-scheme",
      "light",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(350);
    await expect
      .poll(
        async () =>
          (await page.locator(".sidebar").boundingBox())!.x +
          (await page.locator(".sidebar").boundingBox())!.width,
      )
      .toBeLessThanOrEqual(1);
    await page
      .getByRole("button", { name: "Open sidebar", exact: true })
      .click();
    await expect(page.locator(".sidebar")).toHaveClass(/sidebar-open/);
    await page.keyboard.press("Escape");
    await expect(page.locator(".sidebar")).not.toHaveClass(/sidebar-open/);
    await page.waitForTimeout(350);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "artifacts/client-onboarding-mobile.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Packaging Data Import", exact: true }),
    ).toBeVisible();
    const brokenCsv = Buffer.from(
      "SKU,Product Name,Category,Packaging Type,Material,Total Weight (g),Components\nQA-01,Mineral Water 500ml,Beverages,Bottle,PET,23.5,3\nQA-02,Snack Pouch,Snacks,Pouch,PP,,4\nQA-03,Handwash,Personal Care,Bottle,INVALID,12,2\n",
    );
    await page
      .getByLabel("Packaging data file", { exact: true })
      .setInputFiles({
        name: "packaging-review.csv",
        mimeType: "text/csv",
        buffer: brokenCsv,
      });
    let processed = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/packaging-imports") &&
        r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Process File", exact: true })
      .click();
    let processedResponse = await processed;
    expect(processedResponse.status()).toBe(200);
    let importRecord = await processedResponse.json();
    importIds.push(importRecord.id);
    expect(importRecord.analysis.summary).toEqual({
      total: 3,
      complete: 1,
      missing: 1,
      errors: 1,
      completeness: 33,
    });
    await expect(page.getByText("Missing Data", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Validation Error", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Create client", exact: true })
      .click();
    await expect(
      page.getByText(
        "Resolve validation errors before continuing. Missing details can be completed later.",
        { exact: true },
      ),
    ).toBeVisible();
    await page
      .getByRole("tab", { name: "Missing Fields", exact: true })
      .click();
    await expect(
      page.getByText("Total weight (g) is missing", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("tab", { name: "Column Mapping", exact: true })
      .click();
    await expect(
      page.getByRole("combobox", { name: "Product name", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Product name", exact: true })
      .click();
    await page.getByRole("option", { name: "SKU", exact: true }).click();
    await expect(
      page.getByText(
        "Settings or mapping changed. Click Process File to refresh and save your results.",
        { exact: true },
      ),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Product name", exact: true })
      .click();
    await page
      .getByRole("option", { name: "Product Name", exact: true })
      .click();
    processed = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/packaging-imports") &&
        r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Reprocess with mapping", exact: true })
      .click();
    const remapped = await (await processed).json();
    expect(remapped.id).toBe(importRecord.id);
    expect(remapped.mapping.productName).toBe("Product Name");
    await page.getByRole("tab", { name: "Data Preview", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Search packaging data" })
      .fill("Mineral Water");
    await expect(page.locator(".import-preview-table tbody tr")).toHaveCount(1);
    await page.getByRole("textbox", { name: "Search packaging data" }).fill("");
    await page.getByLabel("Filter packaging status").selectOption("missing");
    await expect(page.locator(".import-preview-table tbody tr")).toHaveCount(1);
    await page.getByLabel("Filter packaging status").selectOption("all");
    await page
      .getByRole("button", { name: "All 12 fields", exact: true })
      .click();
    await expect(
      page.getByRole("columnheader", {
        name: "Component Weight (g)",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Summary columns", exact: true })
      .click();
    await expect(page.locator(".import-preview-table tbody tr")).toHaveCount(3);
    await page.evaluate(() => {
      document
        .querySelectorAll<HTMLButtonElement>("[data-close-button]")
        .forEach((b) => b.click());
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: "artifacts/packaging-import-desktop.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Switch to dark mode", exact: true })
      .click();
    await page.screenshot({
      path: "artifacts/packaging-import-dark.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Switch to light mode", exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(350);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "artifacts/packaging-import-mobile.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 1280, height: 720 });
    const validCsv = Buffer.from(
      brokenCsv.toString().replace("INVALID,12,2", "HDPE,12,2"),
    );
    await page
      .getByLabel("Packaging data file", { exact: true })
      .setInputFiles({
        name: "packaging-valid.csv",
        mimeType: "text/csv",
        buffer: validCsv,
      });
    await page
      .getByRole("combobox", { name: "Plant / entity", exact: true })
      .click();
    await page.getByRole("option", { name: company, exact: true }).click();
    await page
      .getByLabel("Update existing SKUs if already present", { exact: true })
      .uncheck();
    processed = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/packaging-imports") &&
        r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Process File", exact: true })
      .click();
    processedResponse = await processed;
    expect(processedResponse.status()).toBe(200);
    importRecord = await processedResponse.json();
    importIds.push(importRecord.id);
    expect(importRecord.analysis.summary.complete).toBe(2);
    expect(importRecord.analysis.summary.missing).toBe(1);
    const persistedDraft = await db
      .collection("packagingImports")
      .findOne({ _id: new ObjectId(importRecord.id) });
    expect(persistedDraft?.status).toBe("draft");
    expect(persistedDraft?.settings.updateExisting).toBe(false);
    expect(persistedDraft?.settings.plant).toBe(company);
    expect(persistedDraft?.mapping.sku).toBe("SKU");
    expect(Buffer.from(persistedDraft?.file.data.buffer).equals(validCsv)).toBe(
      true,
    );
    await expect(
      page
        .getByRole("navigation", { name: "Onboarding progress" })
        .getByText("Review", { exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", {
        name: "Edit packaging for Mineral Water 500ml",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Packaging Composition Builder",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create client", exact: true }),
    ).toHaveCount(0);
    await page.getByLabel("Brand", { exact: true }).fill("Aqua QA");
    await page.getByLabel("Product volume", { exact: true }).fill("500 ml");
    await page.getByLabel("Components", { exact: true }).fill("2");
    await page.getByLabel("Component 1 name", { exact: true }).fill("Bottle");
    await page.getByLabel("Component 1 weight", { exact: true }).fill("21");
    await page
      .getByRole("button", { name: "Add component", exact: true })
      .click();
    await page.getByLabel("Component 2 name", { exact: true }).fill("Cap");
    await page.getByLabel("Component 2 material", { exact: true }).fill("PP");
    await page.getByLabel("Component 2 colour", { exact: true }).fill("Blue");
    await page.getByLabel("Component 2 weight", { exact: true }).fill("2.5");
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=",
      "base64",
    );
    await page.getByLabel("Product photo", { exact: true }).setInputFiles({
      name: "product.png",
      mimeType: "image/png",
      buffer: png,
    });
    await page
      .getByLabel("Component 2 photo", { exact: true })
      .setInputFiles({ name: "cap.png", mimeType: "image/png", buffer: png });
    await expect(page.getByText("Matches", { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.evaluate(() => {
      document
        .querySelectorAll<HTMLButtonElement>("[data-close-button]")
        .forEach((button) => button.click());
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.screenshot({
      path: "artifacts/packaging-composition-desktop.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Switch to dark mode", exact: true })
      .click();
    await page.screenshot({
      path: "artifacts/packaging-composition-dark.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Switch to light mode", exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "artifacts/packaging-composition-mobile.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 1280, height: 720 });
    const editedResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/packaging-imports/${importRecord.id}`) &&
        response.request().method() === "PATCH",
    );
    await page
      .getByRole("button", { name: "Save & continue", exact: true })
      .first()
      .click();
    expect((await editedResponse).status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Packaging Data Import", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "View packaging for Mineral Water 500ml",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("heading", { name: "Packaging details", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("500 ml", { exact: true })).toBeVisible();
    await expect(page.getByText("Aqua QA", { exact: true })).toBeVisible();
    await expect(
      page.locator('.composition-view input:not([type="file"])'),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Save & continue", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Expand product photo", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Next product photo", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Show product photo 2", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", { name: "Previous product photo", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Show product photo 1", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", { name: "Expand product photo", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    const galleryUpload = page.waitForResponse(
      (response) =>
        response
          .url()
          .endsWith(`/api/packaging-imports/${importRecord.id}/photos`) &&
        response.request().method() === "POST",
    );
    await page
      .getByLabel("Upload additional product photos", { exact: true })
      .setInputFiles({ name: "back.png", mimeType: "image/png", buffer: png });
    expect((await galleryUpload).status()).toBe(200);
    await expect(
      page.getByRole("button", { name: "Show product photo 3", exact: true }),
    ).toBeVisible();
    const analysisOpened = page.context().waitForEvent("page");
    await page
      .getByRole("link", {
        name: "Analyse packaging (opens in a new tab)",
        exact: true,
      })
      .click();
    const analysisPage = await analysisOpened;
    await expect(
      analysisPage.getByRole("heading", {
        name: "Packaging analysis",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      analysisPage.getByText("Component weights match", { exact: true }),
    ).toBeVisible();
    await analysisPage.screenshot({
      path: "artifacts/packaging-analysis-desktop.png",
      fullPage: true,
    });
    await analysisPage.setViewportSize({ width: 390, height: 844 });
    expect(
      await analysisPage.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await analysisPage.screenshot({
      path: "artifacts/packaging-analysis-mobile.png",
      fullPage: true,
    });
    await analysisPage.close();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: "artifacts/packaging-view-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "artifacts/packaging-view-mobile.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page
      .getByRole("button", { name: "Back to list", exact: true })
      .click();
    const edited = await db
      .collection("packagingImports")
      .findOne({ _id: new ObjectId(importRecord.id) });
    expect(edited?.analysis.summary.missing).toBe(1);
    expect(edited?.analysis.rows[0].composition.brand).toBe("Aqua QA");
    expect(edited?.analysis.rows[0].composition.components).toHaveLength(2);
    expect(
      await db
        .collection("packagingAssets")
        .countDocuments({ importId: importRecord.id }),
    ).toBe(3);
    expect(edited?.analysis.rows[0].composition.productImages).toHaveLength(1);
    const imageUrl = `/api/packaging-imports/${importRecord.id}/assets/${edited?.analysis.rows[0].composition.productImage}`;
    const imageResponse = await page.request.get(imageUrl);
    expect(imageResponse.status()).toBe(200);
    expect((await imageResponse.body()).equals(png)).toBe(true);
    expect((await request.get(imageUrl)).status()).toBe(401);
    expect(
      (
        await request.patch(`/api/packaging-imports/${importRecord.id}`, {
          headers: { Origin: "http://localhost:3000" },
        })
      ).status(),
    ).toBe(401);
    const savedClient = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/clients") && r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Create client", exact: true })
      .click();
    const createdResponse = await savedClient;
    expect(createdResponse.status(), await createdResponse.text()).toBe(201);
    await expect(page.getByText(company, { exact: true })).toBeVisible();
    expect(await db.collection("clients").countDocuments({ company })).toBe(1);
    await page
      .getByRole("textbox", { name: "Search workspace clients", exact: true })
      .fill("no-matching-client");
    await page
      .getByRole("textbox", { name: "Search workspace clients", exact: true })
      .press("Enter");
    await expect(
      page.getByRole("heading", { name: "No matching clients.", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "Search workspace clients", exact: true })
      .fill(company);
    await page
      .getByRole("textbox", { name: "Search workspace clients", exact: true })
      .press("Enter");
    await expect(page.getByText(company, { exact: true })).toBeVisible();
    await expect(
      page.getByText("Client created successfully", { exact: true }),
    ).toBeVisible();
    const storedClient = await db.collection("clients").findOne({ company });
    expect(storedClient?.packagingImportId).toBe(importRecord.id);
    const confirmedImport = await db
      .collection("packagingImports")
      .findOne({ _id: new ObjectId(importRecord.id) });
    expect(confirmedImport?.clientId).toBe(storedClient?._id.toString());
    expect(confirmedImport?.status).toBe("confirmed");
    expect(confirmedImport?.expiresAt).toBeUndefined();
    expect(
      await db
        .collection("packagingSkus")
        .countDocuments({ clientId: storedClient?._id.toString() }),
    ).toBe(3);
    await page
      .getByRole("button", { name: "Manage packaging", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "View packaging for Mineral Water 500ml",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", { name: "Show product photo 3", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("500 ml", { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "Edit details", exact: true })
      .first()
      .click();
    await expect(page.getByLabel("Brand", { exact: true })).toHaveValue(
      "Aqua QA",
    );
    await page.getByLabel("Brand", { exact: true }).fill("Updated Aqua QA");
    const confirmedEdit = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/packaging-imports/${importRecord.id}`) &&
        response.request().method() === "PATCH",
    );
    await page
      .getByRole("button", { name: "Save & continue", exact: true })
      .first()
      .click();
    expect((await confirmedEdit).status()).toBe(200);
    const savedSku = await db
      .collection("packagingSkus")
      .findOne({ importId: importRecord.id, sku: "QA-01" });
    expect(savedSku?.composition.brand).toBe("Updated Aqua QA");
    expect(savedSku?.composition.components).toHaveLength(2);
    expect(savedSku?.composition.productImages).toHaveLength(1);
    expect(
      await db.collection("packagingAssets").countDocuments({
        importId: importRecord.id,
        expiresAt: { $exists: true },
      }),
    ).toBe(0);
    await page
      .getByRole("button", { name: "Back to clients", exact: true })
      .click();
    const importedFile = await page.request.get(
      `/api/packaging-imports/${importRecord.id}?download=true`,
    );
    expect(importedFile.status()).toBe(200);
    expect((await importedFile.body()).equals(validCsv)).toBe(true);
    expect(storedClient?.legalName).toBe(company);
    expect(storedClient?.tradeName).toBe("QA Packaging");
    expect(storedClient?.gstNumber).toBe("27ABCDE1234F1Z5");
    expect(storedClient?.registrationNumber).toBe("QA-REG-001");
    expect(storedClient?.organisationRole).toBe("Producer");
    expect(storedClient?.registeredAddress).toBe(
      "12 Test Street, Mumbai, Maharashtra 400001",
    );
    expect(storedClient?.telephone).toBe("+91 98765 43210");
    expect(storedClient?.authorisedPerson).toBe("QA Contact");
    expect(
      Buffer.from(storedClient?.documents[0].data.buffer).equals(fileBytes),
    ).toBe(true);
    const downloadPath = `/api/clients/${storedClient?._id}/documents/0`;
    const download = await page.request.get(downloadPath);
    expect(download.status()).toBe(200);
    expect((await download.body()).equals(fileBytes)).toBe(true);
    expect((await request.get(downloadPath)).status()).toBe(401);
    const clientList = await page.request.get("/api/clients");
    const listed = (await clientList.json()).find(
      (c: { _id: string }) => c._id === String(storedClient?._id),
    );
    expect(listed.documents[0].data).toBeUndefined();
    const invalidUpload = await page.request.post("/api/clients", {
      headers: { Origin: "http://localhost:3000" },
      multipart: {
        data: JSON.stringify({
          legalName: company,
          tradeName: "QA Packaging",
          gstNumber: "27ABCDE1234F1Z5",
          registrationNumber: "",
          organisationRole: "Producer",
          registeredAddress: "12 Test Street, Mumbai 400001",
          email,
          telephone: "+91 9876543210",
          authorisedPerson: "QA Contact",
          country: "India",
          industry: "Retail",
          materials: ["Plastic"],
          notes: "",
          packagingImportId: importRecord.id,
        }),
        documents: {
          name: "fake.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("not-a-pdf"),
        },
      },
    });
    expect(invalidUpload.status()).toBe(400);
    expect(await db.collection("clients").countDocuments({ company })).toBe(1);
    await page
      .getByRole("link", { name: "User management", exact: true })
      .click();
    await page.getByRole("button", { name: "Add team member" }).click();
    await page
      .getByRole("textbox", { name: "First name", exact: true })
      .fill("Test");
    await page
      .getByRole("textbox", { name: "Last name", exact: true })
      .fill("Manager");
    createdUserEmail = `qa-${randomUUID()}@example.invalid`;
    await page
      .getByRole("textbox", { name: "Email", exact: true })
      .fill(createdUserEmail);
    await page
      .getByLabel("Initial password", { exact: false })
      .fill("QA-only-password-128!");
    await page.getByRole("button", { name: "Create team member" }).click();
    await expect(
      page.getByText(createdUserEmail, { exact: true }),
    ).toBeVisible();
    const created = await db
      .collection("user")
      .findOne({ email: createdUserEmail });
    expect(created?.role).toBe("user");
    await page.getByRole("link", { name: "My profile", exact: true }).click();
    await page
      .getByRole("textbox", { name: "First name", exact: true })
      .fill("Updated");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByText("Your profile has been updated."),
    ).toBeVisible();
    expect((await db.collection("user").findOne({ _id: id }))?.firstName).toBe(
      "Updated",
    );
    // Multiple draft SKUs without identifiers or materials must remain separate records.
    const incompleteUpload = await page.request.post("/api/packaging-imports", {
      headers: { Origin: "http://localhost:3000" },
      multipart: {
        file: {
          name: "incomplete.csv",
          mimeType: "text/csv",
          buffer: Buffer.from(
            "SKU,Product Name,Category,Packaging Type,Material,Total Weight (g),Components\n,Draft A,Food,Bottle,,10,1\n,Draft B,Food,Bottle,,12,1\n",
          ),
        },
      },
    });
    expect(incompleteUpload.status()).toBe(200);
    const incompleteImport = await incompleteUpload.json();
    importIds.push(incompleteImport.id);
    expect(incompleteImport.analysis.summary.missing).toBe(2);
    const incompleteClient = await page.request.post("/api/clients", {
      headers: { Origin: "http://localhost:3000" },
      multipart: {
        data: JSON.stringify({
          legalName: company,
          tradeName: "QA Packaging",
          gstNumber: "27ABCDE1234F1Z5",
          registrationNumber: "",
          organisationRole: "Producer",
          registeredAddress: "12 Test Street, Mumbai 400001",
          email,
          telephone: "+91 9876543210",
          authorisedPerson: "QA Contact",
          country: "India",
          industry: "Retail",
          materials: [],
          notes: "",
          packagingImportId: incompleteImport.id,
        }),
        documents: {
          name: "registration.pdf",
          mimeType: "application/pdf",
          buffer: fileBytes,
        },
      },
    });
    expect(incompleteClient.status(), await incompleteClient.text()).toBe(201);
    expect(
      await db
        .collection("packagingSkus")
        .countDocuments({ importId: incompleteImport.id, sku: "" }),
    ).toBe(2);
    await db
      .collection("user")
      .updateOne({ _id: id }, { $set: { role: "user" } });
    const denied = await page.request.get("/api/users");
    expect(denied.status()).toBe(403);
    await db
      .collection("user")
      .updateOne({ _id: id }, { $set: { active: false } });
    expect((await page.request.get("/api/clients")).status()).toBe(401);
    expect(browserErrors).toEqual([]);
  } finally {
    await db
      .collection("packagingAssets")
      .deleteMany({ importId: { $in: importIds } });
    await db
      .collection("packagingSkus")
      .deleteMany({ importId: { $in: importIds } });
    await db
      .collection("packagingImports")
      .deleteMany({ _id: { $in: importIds.map((id) => new ObjectId(id)) } });
    const child = createdUserEmail
      ? await db.collection("user").findOne({ email: createdUserEmail })
      : null;
    const ids = [id.toString(), ...(child ? [child._id.toString()] : [])];
    await db.collection("session").deleteMany({ userId: { $in: ids } });
    await db.collection("account").deleteMany({ userId: { $in: ids } });
    await db
      .collection("verification")
      .deleteMany({ identifier: `sign-in-otp-${email}` });
    await db.collection("clients").deleteMany({ company });
    await db
      .collection("user")
      .deleteMany({ _id: { $in: [id, ...(child ? [child._id] : [])] } });
    await client.close();
  }
});
