import { test, expect } from "@playwright/test";
import { MongoClient, ObjectId, Binary } from "mongodb";
import { createHash, randomUUID } from "node:crypto";
import { setServers } from "node:dns";
import nextEnv from "@next/env";
import {
  parsePackagingFile,
  analysePackaging,
} from "../src/lib/packaging-import";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
if (process.env.MONGODB_DNS_SERVERS)
  setServers(process.env.MONGODB_DNS_SERVERS.split(","));

test("supplier OTP session sees only assigned components and cannot bypass access checks", async ({
  browser,
}) => {
  test.setTimeout(180000);
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const database = client.db(process.env.MONGODB_DB);
  const importId = new ObjectId();
  const suffix = randomUUID();
  const emails = [
    `krishna-${suffix}@example.invalid`,
    `jack-${suffix}@example.invalid`,
  ];
  const userIds = [new ObjectId(), new ObjectId()];
  const imageIds = [new ObjectId(), new ObjectId()];
  const settings = {
    category: "All Categories" as const,
    plant: "All Plants",
    firstRow: "headers" as const,
    updateExisting: true,
  };
  const csv = `SKU,Product Name,Category,Packaging Type,Total Weight (g),Components,Component Name,Material,Component Weight (g),Food Grade (Yes/No),Supplier Email\nS1,Test Water,Beverages,Bottle,23,2,Bottle,PET,21,Yes,${emails[0]}\nS1,Test Water,Beverages,Bottle,23,2,Cap,PP,2,No,${emails[1]}\n`;
  const parsed = await parsePackagingFile(
    Buffer.from(csv),
    "supplier-test.csv",
    settings,
  );
  const analysis = analysePackaging(parsed.rawRows, parsed.suggested, settings);
  const components = analysis.rows[0].composition!.components;
  const rowNumber = analysis.rows[0].rowNumber;
  components.forEach(
    (component, index) => (component.image = imageIds[index].toString()),
  );
  const origin = { Origin: "http://localhost:3000" };
  const contexts = [];
  try {
    await database.collection("packagingImports").insertOne({
      _id: importId,
      status: "confirmed",
      createdBy: "test-owner",
      headers: parsed.headers,
      mapping: parsed.suggested,
      rawRows: parsed.rawRows,
      settings,
      analysis,
    });
    await database.collection("packagingAssets").insertMany(
      imageIds.map((_id) => ({
        _id,
        importId: importId.toString(),
        type: "image/png",
        data: new Binary(
          Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
            "base64",
          ),
        ),
      })),
    );
    for (const [index, email] of emails.entries()) {
      await database.collection("user").insertOne({
        _id: userIds[index],
        email,
        name: `Test Supplier ${index}`,
        role: "supplier",
        active: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const otp = "739182";
      await database.collection("verification").insertOne({
        identifier: `sign-in-otp-${email}`,
        value: `${createHash("sha256").update(otp).digest("base64url")}:0`,
        expiresAt: new Date(Date.now() + 300000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const context = await browser.newContext();
      contexts.push(context);
      const page = await context.newPage();
      const login = await page.request.post("/api/auth/sign-in/email-otp", {
        headers: origin,
        data: { email, otp },
      });
      expect(login.status(), await login.text()).toBe(200);
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/dashboard\/supplier$/);
      await expect(
        page.getByRole("heading", { name: "Your packaging components" }),
      ).toBeVisible();
      const own = components[index];
      const other = components[1 - index];
      await expect(
        page.getByRole("heading", { name: own.name, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: other.name, exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("link", { name: "Client onboarding", exact: true }),
      ).toHaveCount(0);
      await page.goto("/dashboard/clients");
      await expect(page).toHaveURL(/\/dashboard\/supplier$/);
      for (const url of [
        "/api/clients",
        `/api/packaging-imports/${importId}`,
        `/api/packaging-imports/${importId}?download=true`,
        `/api/packaging-imports/${importId}/group-packaging`,
        `/api/packaging-imports/${importId}/assets/${imageIds[1 - index]}`,
      ]) {
        expect((await page.request.get(url)).status(), url).toBe(403);
      }
      const proofUrl = (componentId: string) =>
        `/api/packaging-imports/${importId}/proofs?rowNumber=${rowNumber}&componentId=${componentId}`;
      expect((await page.request.get(proofUrl(own.id))).status()).toBe(200);
      expect((await page.request.get(proofUrl(other.id))).status()).toBe(403);
      const classify = (componentId: string) =>
        page.request.put(`/api/packaging-imports/${importId}/classification`, {
          headers: origin,
          data: {
            rowNumber,
            componentId,
            family: "Plastic",
            categoryId: "pet-bottles",
          },
        });
      expect((await classify(other.id)).status()).toBe(403);
      expect((await classify(own.id)).status()).toBe(200);
      const proofUpload = (componentId: string, requirementId = "heavy") =>
        page.request.post(proofUrl(componentId), {
          headers: origin,
          multipart: {
            requirementId,
            files: {
              name: "proof.pdf",
              mimeType: "application/pdf",
              buffer: Buffer.from("%PDF-1.7\nSupplier proof"),
            },
          },
        });
      expect((await proofUpload(other.id)).status()).toBe(403);
      expect((await proofUpload(own.id)).status()).toBe(200);
      if (index === 1)
        expect((await proofUpload(own.id, "pfas")).status()).toBe(400);
      const photoUpload = (componentId: string) =>
        page.request.post(`/api/packaging-imports/${importId}/photos`, {
          headers: origin,
          multipart: {
            rowNumber: String(rowNumber),
            componentId,
            photos: {
              name: "photo.png",
              mimeType: "image/png",
              buffer: Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
                "base64",
              ),
            },
          },
        });
      expect((await photoUpload(other.id)).status()).toBe(403);
      const photoResponse = await photoUpload(own.id);
      expect(photoResponse.status()).toBe(200);
      const photoData = await photoResponse.json();
      expect(
        photoData.composition.components.map(
          (component: { id: string }) => component.id,
        ),
      ).toEqual([own.id]);
      await page.getByRole("link", { name: "Analyse", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: own.name, exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: /Sustainability Checklist/ })
        .click();
      await expect(
        page.getByRole("heading", {
          name: "Sustainability Checklist",
          exact: true,
        }),
      ).toBeVisible();
      await page.goto(
        `/dashboard/packaging/${importId}/${rowNumber}/analyse?component=${other.id}`,
      );
      await expect(
        page.getByRole("heading", { name: other.name, exact: true }),
      ).toHaveCount(0);
      await page.goto("/dashboard/supplier");
      if (index === 0)
        await page.screenshot({
          path: "artifacts/supplier-portal-desktop.png",
          fullPage: true,
        });
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(
        page.getByRole("heading", { name: own.name, exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      if (index === 0)
        await page.screenshot({
          path: "artifacts/supplier-portal-mobile.png",
          fullPage: true,
        });
      await context.close();
    }
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
    await database
      .collection("session")
      .deleteMany({ userId: { $in: userIds.map(String) } });
    await database.collection("verification").deleteMany({
      identifier: { $in: emails.map((email) => `sign-in-otp-${email}`) },
    });
    await database.collection("user").deleteMany({ _id: { $in: userIds } });
    await database.collection("packagingImports").deleteOne({ _id: importId });
    await database
      .collection("packagingAssets")
      .deleteMany({ importId: importId.toString() });
    await database
      .collection("packagingClassifications")
      .deleteMany({ importId: importId.toString() });
    await database
      .collection("sustainabilityProofs")
      .deleteMany({ importId: importId.toString() });
    await client.close();
  }
});
