import { test, expect } from "@playwright/test";
import { MongoClient, ObjectId, Binary } from "mongodb";
import { createHash, randomUUID } from "node:crypto";
import { setServers } from "node:dns";
import { readFile } from "node:fs/promises";
import nextEnv from "@next/env";
import {
  analysePackaging,
  parsePackagingFile,
} from "../src/lib/packaging-import";
import { initialComposition } from "../src/lib/packaging-composition";
nextEnv.loadEnvConfig(process.cwd());
if (process.env.MONGODB_DNS_SERVERS)
  setServers(process.env.MONGODB_DNS_SERVERS.split(","));

test("component Analyse restores classification while SKU analysis stays separate", async ({
  page,
}) => {
  test.setTimeout(120000);
  page.setDefaultTimeout(15000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const mongo = new MongoClient(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 10000,
  });
  await mongo.connect();
  const db = mongo.db(process.env.MONGODB_DB || "ppwm");
  const userId = new ObjectId(),
    importId = new ObjectId(),
    foreignId = new ObjectId();
  const assets = [
    new ObjectId(),
    new ObjectId(),
    new ObjectId(),
    new ObjectId(),
  ];
  const email = `sku-analysis-${randomUUID()}@example.invalid`,
    otp = "739182";
  const settings = {
    category: "All Categories" as const,
    plant: "All Plants",
    firstRow: "headers" as const,
    updateExisting: true,
  };
  const parsed = await parsePackagingFile(
    Buffer.from(
      "SKU,Product Name,Category,Packaging Type,Material,Total Weight (g),Components\nSKU-001,Mineral Water SKU,Beverages,Bottle,PET,23,3\n",
    ),
    "sku-test.csv",
    settings,
  );
  const analysis = analysePackaging(parsed.rawRows, parsed.suggested, settings);
  const row = analysis.rows[0];
  row.composition = initialComposition(row);
  const template = row.composition.components[0];
  row.composition.productImage = assets[0].toString();
  row.composition.productImages = [assets[0].toString()];
  row.composition.components = ["Bottle", "Cap", "Label"].map(
    (name, index) => ({
      ...template,
      id: `component-${index + 1}`,
      name,
      image: assets[index + 1].toString(),
      material: index === 0 ? "PET" : "PP",
      weight: index === 0 ? "20" : "1.5",
    }),
  );
  const record = {
    createdBy: userId.toString(),
    status: "confirmed",
    analysis,
    settings,
    headers: parsed.headers,
    mapping: parsed.suggested,
    rawRows: parsed.rawRows,
    file: { name: "sku-test.csv", type: "CSV" },
  };
  try {
    await db.collection("user").insertOne({
      _id: userId,
      email,
      name: "SKU Analysis Test",
      role: "user",
      active: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.collection("packagingImports").insertMany([
      { _id: importId, ...record },
      { _id: foreignId, ...record, createdBy: new ObjectId().toString() },
    ]);
    const bytes = await readFile("public/images/materials/bottle-splash.webp");
    await db.collection("packagingAssets").insertMany(
      assets.map((_id) => ({
        _id,
        importId: importId.toString(),
        name: "sku.webp",
        type: "image/webp",
        data: new Binary(bytes),
      })),
    );
    await db.collection("verification").insertOne({
      identifier: `sign-in-otp-${email}`,
      value: `${createHash("sha256").update(otp).digest("base64url")}:0`,
      expiresAt: new Date(Date.now() + 300000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const login = await page.request.post("/api/auth/sign-in/email-otp", {
      headers: { Origin: "http://localhost:3000" },
      data: { email, otp },
    });
    expect(login.status(), await login.text()).toBe(200);
    await page.goto("/dashboard/sku-analysis");
    const nav = page.getByRole("navigation", { name: "Workspace navigation" });
    await expect(
      nav.getByRole("link", { name: "SKU Analyse", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("heading", { name: "Mineral Water SKU", exact: true }),
    ).toHaveCount(1);
    await page.getByLabel("Search SKUs").fill("no-match");
    await expect(
      page.getByRole("heading", { name: "No matching SKUs" }),
    ).toBeVisible();
    await page.getByLabel("Search SKUs").fill("");
    await page.goto(
      `/dashboard/clients?packaging=${importId}&row=${row.rowNumber}`,
    );
    await page
      .locator('a[href*="analyse?component=component-1"]')
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Bottle", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Supplier details", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "SKU photo gallery" }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: /Material Select material type/ })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "What material is this component made from?",
        exact: true,
      }),
    ).toBeVisible();
    await page.goto(
      `/dashboard/packaging/${importId}/${row.rowNumber}/analyse?component=component-2`,
    );
    await expect(
      page.getByRole("heading", { name: "Cap", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Supplier details", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: "artifacts/component-analyse-restored.png",
      fullPage: true,
    });
    await page.goto(
      `/dashboard/packaging/${importId}/${row.rowNumber}/analyse?component=component-1&section=articles`,
    );
    await expect(
      page.getByRole("heading", { name: "Articles", exact: true }),
    ).toBeVisible();
    await page.goto(
      `/dashboard/packaging/${importId}/${row.rowNumber}/analyse`,
    );
    const gallery = page.getByRole("region", { name: "SKU photo gallery" });
    await expect(gallery.locator("img")).toHaveCount(1);
    await expect(gallery.locator("img").first()).toHaveAttribute(
      "src",
      new RegExp(assets[0].toString()),
    );
    await page.getByRole("link", { name: "Analyse", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Articles", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Open Article \d+ assessment/ }),
    ).toHaveCount(8);
    await page.screenshot({
      path: "artifacts/sku-articles-desktop.png",
      fullPage: true,
    });
    await page.getByRole("link", { name: /Open Article 6 assessment/ }).click();
    await expect(
      page.getByRole("heading", { name: "Article 6 assessment", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Back to Articles", exact: true })
      .click();
    await page.getByRole("link", { name: /Open Article 5 assessment/ }).click();
    await expect(
      page.getByRole("heading", { name: "SKU-level assessment", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /Scope & identity/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /Material & construction/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /Reuse & recycling interaction/ }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Back to Articles", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Articles", exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "artifacts/sku-articles-mobile.png",
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(
      `/dashboard/packaging/${importId}/${row.rowNumber}/analyse?component=component-1`,
    );
    await expect(
      page.getByRole("heading", { name: "Supplier details", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const foreign = await page.request.get(
      `/dashboard/packaging/${foreignId}/${row.rowNumber}/analyse`,
    );
    expect(foreign.status()).toBe(404);
  } finally {
    await db
      .collection("packagingAssets")
      .deleteMany({ importId: importId.toString() });
    await db.collection("session").deleteMany({ userId: userId.toString() });
    await db
      .collection("verification")
      .deleteMany({ identifier: `sign-in-otp-${email}` });
    await db.collection("user").deleteOne({ _id: userId });
    await db
      .collection("packagingImports")
      .deleteMany({ _id: { $in: [importId, foreignId] } });
    await mongo.close();
  }
});
