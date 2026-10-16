import { test, expect } from "@playwright/test";
import { MongoClient, ObjectId } from "mongodb";
import { randomUUID, createHash } from "node:crypto";
import { setServers } from "node:dns";
import nextEnv from "@next/env";
import {
  parsePackagingFile,
  analysePackaging,
} from "../src/lib/packaging-import";
import { initialComposition } from "../src/lib/packaging-composition";
nextEnv.loadEnvConfig(process.cwd());
if (process.env.MONGODB_DNS_SERVERS)
  setServers(process.env.MONGODB_DNS_SERVERS.split(","));

test("whole-SKU group ratio calculates, persists and stays independent between SKUs", async ({
  page,
}) => {
  test.setTimeout(120000);
  const mongo = new MongoClient(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 10000,
  });
  await mongo.connect();
  const db = mongo.db(process.env.MONGODB_DB);
  const userId = new ObjectId(),
    importId = new ObjectId();
  const email = `group-ratio-${randomUUID()}@example.invalid`,
    otp = "739182";
  const settings = {
    category: "All Categories" as const,
    plant: "All Plants",
    firstRow: "headers" as const,
    updateExisting: true,
  };
  const parsed = await parsePackagingFile(
    Buffer.from(
      "SKU,Product Name,Category,Packaging Type,Material,Total Weight (g),Components\nSKU-001,Water,Beverages,Bottle,PET,20,1\nSKU-002,Snacks,Snacks,Pouch,PP,10,1\n",
    ),
    "group-ratio.csv",
    settings,
  );
  const analysis = analysePackaging(parsed.rawRows, parsed.suggested, settings);
  analysis.rows.forEach((row) => (row.composition = initialComposition(row)));
  try {
    await db
      .collection("user")
      .insertOne({
        _id: userId,
        email,
        name: "Group Test",
        role: "user",
        active: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    await db
      .collection("packagingImports")
      .insertOne({
        _id: importId,
        createdBy: userId.toString(),
        status: "confirmed",
        analysis,
        settings,
        headers: parsed.headers,
        mapping: parsed.suggested,
        rawRows: parsed.rawRows,
        file: { name: "group-ratio.csv", type: "CSV" },
      });
    await db
      .collection("verification")
      .insertOne({
        identifier: `sign-in-otp-${email}`,
        value: `${createHash("sha256").update(otp).digest("base64url")}:0`,
        expiresAt: new Date(Date.now() + 300000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    let login = await page.request.post("/api/auth/sign-in/email-otp", {
      headers: { Origin: "http://localhost:3000" },
      data: { email, otp },
    });
    if (login.status() === 429) {
      await page.waitForTimeout(
        (Number(login.headers()["x-retry-after"] || 60) + 1) * 1000,
      );
      login = await page.request.post("/api/auth/sign-in/email-otp", {
        headers: { Origin: "http://localhost:3000" },
        data: { email, otp },
      });
    }
    expect(login.status()).toBe(200);
    for (const [index, row] of analysis.rows.entries()) {
      await page.goto(
        `/dashboard/clients?packaging=${importId}&row=${row.rowNumber}`,
      );
      await page
        .getByRole("tab", { name: "Group Packaging", exact: true })
        .click();
      await expect(
        page.getByRole("navigation", { name: "Group packaging products" }),
      ).toHaveCount(0);
      const count = page.getByRole("spinbutton", {
        name: "Group count",
        exact: true,
      });
      const units = page.getByRole("spinbutton", {
        name: "SKUs per group",
        exact: true,
      });
      await expect(count).toBeEnabled();
      await expect(count).toHaveValue("");
      await count.fill(index === 0 ? "3" : "2");
      await units.fill("3");
      await expect(
        page.getByLabel("Total SKU units", { exact: true }),
      ).toContainText(index === 0 ? "3 : 3 = 9" : "2 : 3 = 6");
      const saved = page.waitForResponse(
        (response) =>
          response.url().endsWith("/group-packaging") &&
          response.request().method() === "PUT",
      );
      await page
        .getByRole("button", { name: "Save group counts", exact: true })
        .click();
      expect((await saved).status()).toBe(200);
      await page.reload();
      await page
        .getByRole("tab", { name: "Group Packaging", exact: true })
        .click();
      await expect(count).toHaveValue(index === 0 ? "3" : "2");
      await expect(units).toHaveValue("3");
      if (index === 0)
        await page.screenshot({
          path: "artifacts/group-sku-ratio-desktop.png",
          fullPage: true,
        });
    }
    const saved = await db
      .collection("groupPackaging")
      .findOne({ _id: importId });
    expect(
      saved?.groups.map((group: { count: number; unitsPerGroup: number }) => [
        group.count,
        group.unitsPerGroup,
      ]),
    ).toEqual([
      [3, 3],
      [2, 3],
    ]);
  } finally {
    await db.collection("session").deleteMany({ userId: userId.toString() });
    await db
      .collection("verification")
      .deleteMany({ identifier: `sign-in-otp-${email}` });
    await db.collection("user").deleteOne({ _id: userId });
    await db.collection("packagingImports").deleteOne({ _id: importId });
    await db.collection("groupPackaging").deleteOne({ _id: importId });
    await mongo.close();
  }
});
