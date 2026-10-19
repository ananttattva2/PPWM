import { readFile } from "node:fs/promises";
import {
  cleanupCloudinaryTestFiles,
  cleanupCloudinaryTestAvatar,
} from "./cloudinary-test-cleanup";
import { test, expect } from "@playwright/test";
import { MongoClient, ObjectId } from "mongodb";
import { createHash, randomUUID } from "node:crypto";
import { setServers } from "node:dns";
import nextEnv from "@next/env";
import {
  analysePackaging,
  parsePackagingFile,
} from "../src/lib/packaging-import";
import { initialComposition } from "../src/lib/packaging-composition";
nextEnv.loadEnvConfig(process.cwd());
if (process.env.MONGODB_DNS_SERVERS)
  setServers(process.env.MONGODB_DNS_SERVERS.split(","));

test("five additional packaging tabs persist details and evidence with isolated access", async ({
  page,
}) => {
  test.setTimeout(240000);
  page.setDefaultTimeout(15000);
  const mongo = new MongoClient(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 10000,
  });
  await mongo.connect();
  const db = mongo.db(process.env.MONGODB_DB || "ppwm");
  const userId = new ObjectId(),
    importId = new ObjectId(),
    foreignId = new ObjectId();
  const email = `packaging-details-${randomUUID()}@example.invalid`,
    otp = "739182";
  const settings = {
    category: "All Categories" as const,
    plant: "All Plants",
    firstRow: "headers" as const,
    updateExisting: true,
  };
  const parsed = await parsePackagingFile(
    Buffer.from(
      "SKU,Product Name,Category,Packaging Type,Material,Total Weight (g),Components\nDETAIL-001,Mineral Water,Beverages,Bottle,PET,20,1\nDETAIL-002,Other product,Beverages,Bottle,PET,20,1\n",
    ),
    "details.csv",
    settings,
  );
  const analysis = analysePackaging(parsed.rawRows, parsed.suggested, settings);
  analysis.rows.forEach((row) => (row.composition = initialComposition(row)));
  const rowNumber = analysis.rows[0].rowNumber;
  const path = (kind: string) =>
    `/api/packaging-imports/${importId}/details/${kind}`;
  let uploadedImportId: string | undefined;
  try {
    await db.collection("user").insertOne({
      _id: userId,
      email,
      name: "Packaging Detail Test",
      role: "user",
      active: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const record = {
      createdBy: userId.toString(),
      status: "confirmed",
      analysis,
      settings,
      headers: parsed.headers,
      mapping: parsed.suggested,
      rawRows: parsed.rawRows,
      file: { name: "details.csv", type: "CSV" },
    };
    await db.collection("packagingImports").insertMany([
      { _id: importId, ...record },
      { _id: foreignId, ...record, createdBy: new ObjectId().toString() },
    ]);
    expect(
      (
        await page.request.get(`${path("ecommerce")}?rowNumber=${rowNumber}`)
      ).status(),
    ).toBe(401);
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
    expect(
      (
        await page.request.get(
          `/api/packaging-imports/${foreignId}/details/ecommerce?rowNumber=${rowNumber}`,
        )
      ).status(),
    ).toBe(403);
    expect(
      (await page.request.get(`${path("ecommerce")}?rowNumber=999`)).status(),
    ).toBe(404);
    await page.goto(
      `/dashboard/clients?packaging=${importId}&row=${rowNumber}`,
    );
    const tabs = [
      ["ecommerce", "E-commerce"],
      ["service", "Service Packaging"],
      ["reuse", "Re-use / Refill"],
      ["beverage", "Beverage / DRS"],
      ["composite", "Composite / Multi-material"],
    ] as const;
    for (const [kind, label] of tabs) {
      await page.getByRole("tab", { name: label, exact: true }).click();
      const panel = page.getByRole("tabpanel", { name: label, exact: true });
      const name = panel.getByLabel("Packaging name", { exact: true });
      await expect(name).toBeEnabled();
      await name.fill(`${label} record`);
      await panel
        .getByLabel("Component name", { exact: true })
        .fill("Main component");
      await panel
        .getByLabel("Component material", { exact: true })
        .selectOption(kind === "reuse" ? "Glass" : "Paperboard");
      await panel
        .getByLabel("Weight each (g)", { exact: true })
        .fill(kind === "reuse" ? "300" : "13");
      if (kind === "ecommerce")
        await panel.getByLabel("Number of orders", { exact: true }).fill("100");
      if (kind === "service")
        await panel
          .getByLabel("Number of servings", { exact: true })
          .fill("500");
      if (kind === "reuse")
        await panel.getByLabel("Units in pool", { exact: true }).fill("1000");
      if (kind === "beverage")
        await panel
          .getByRole("combobox", { name: "Scheme applicability", exact: true })
          .selectOption("Pending review");
      if (kind === "composite")
        await panel.getByLabel(/Total unit weight/).fill("13");
      const upload = panel.getByLabel("Upload photo", { exact: true });
      await upload.setInputFiles({
        name: "packaging.webp",
        mimeType: "image/webp",
        buffer: await readFile("public/images/materials/bottle-splash.webp"),
      });
      await expect(
        panel.getByRole("link", { name: "packaging.webp", exact: true }),
      ).toBeVisible();
      const saved = page.waitForResponse(
        (response) =>
          response.url().endsWith(path(kind)) &&
          response.request().method() === "PUT",
      );
      await panel
        .getByRole("button", { name: "Save details", exact: true })
        .click();
      expect((await saved).status()).toBe(200);
      const stored = await db
        .collection("packagingDetails")
        .findOne({ importId: importId.toString(), kind, rowNumber });
      expect(stored?.name).toBe(`${label} record`);
      expect(stored?.attachments.photo.id).toBeTruthy();
      const uploadedFile = await db
        .collection("packagingDetailFiles")
        .findOne({ _id: new ObjectId(stored!.attachments.photo.id) });
      expect(uploadedFile?.storage?.provider).toBe("cloudinary");
      expect(uploadedFile?.data).toBeUndefined();
      const fileResponse = await page.request.get(
        `${path(kind)}/files?rowNumber=${rowNumber}&asset=${stored!.attachments.photo.id}`,
      );
      expect(fileResponse.status()).toBe(200);
      expect(fileResponse.headers()["content-type"]).toBe("image/webp");
      const otherRow = await page.request.get(
        `${path(kind)}?rowNumber=${analysis.rows[1].rowNumber}`,
      );
      expect(await otherRow.json()).toBeNull();
      if (kind === "ecommerce")
        await page.screenshot({
          path: "artifacts/additional-ecommerce-desktop.png",
          fullPage: true,
        });
    }
    await page.reload();
    for (const [, label] of tabs) {
      await page.getByRole("tab", { name: label, exact: true }).click();
      const panel = page.getByRole("tabpanel", { name: label, exact: true });
      await expect(
        panel.getByLabel("Packaging name", { exact: true }),
      ).toHaveValue(`${label} record`);
      await expect(
        panel.getByRole("link", { name: "packaging.webp", exact: true }),
      ).toBeVisible();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "artifacts/additional-composite-mobile.png",
      fullPage: true,
    });
    const mobilePanel = page.getByRole("tabpanel", {
      name: "Composite / Multi-material",
      exact: true,
    });
    await expect
      .poll(async () => {
        const panelWidth = (await mobilePanel.boundingBox())!.width;
        return mobilePanel
          .locator("section")
          .evaluateAll(
            (sections, width) =>
              sections.every(
                (section) => section.getBoundingClientRect().width <= width,
              ),
            panelWidth,
          );
      })
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "artifacts/additional-composite-mobile.png",
      fullPage: true,
    });
    const payload = await (
      await page.request.get(`${path("ecommerce")}?rowNumber=${rowNumber}`)
    ).json();
    const headers = { Origin: "http://localhost:3000" };
    const genericUpload = await page.request.post("/api/uploads", {
      headers,
      multipart: {
        importId: importId.toString(),
        rowNumber: String(rowNumber),
        slot: "integration-proof",
        file: {
          name: "evidence.csv",
          mimeType: "text/csv",
          buffer: Buffer.from("SKU,Weight\nTEST,10\n"),
        },
      },
    });
    expect(genericUpload.status(), await genericUpload.text()).toBe(200);
    const genericFile = await genericUpload.json();
    const genericStored = await db
      .collection("mediaUploads")
      .findOne({ _id: new ObjectId(genericFile.id) });
    expect(genericStored?.storage?.provider).toBe("cloudinary");
    expect(genericStored?.data).toBeUndefined();
    const genericDownload = await page.request.get(
      `/api/uploads?id=${genericFile.id}`,
    );
    expect(await genericDownload.text()).toBe("SKU,Weight\nTEST,10\n");
    const avatarBytes = await readFile(
      "public/images/materials/bottle-splash.webp",
    );
    const profileResponse = await page.request.patch("/api/profile", {
      headers,
      data: {
        firstName: "Cloudinary",
        lastName: "Test",
        image: `data:image/webp;base64,${avatarBytes.toString("base64")}`,
      },
    });
    expect(profileResponse.status()).toBe(200);
    const profile = await db.collection("user").findOne({ _id: userId });
    expect(profile?.imageStorage.provider).toBe("cloudinary");
    expect((await page.request.get(profile!.image)).status()).toBe(200);
    const photoBytes = await page.screenshot({ type: "png" });
    const photoResponse = await page.request.post(
      `/api/packaging-imports/${importId}/photos`,
      {
        headers,
        multipart: {
          rowNumber: String(rowNumber),
          photos: {
            name: "test-product.png",
            mimeType: "image/png",
            buffer: photoBytes,
          },
        },
      },
    );
    expect(photoResponse.status(), await photoResponse.text()).toBe(200);
    const photo = await db
      .collection("packagingAssets")
      .findOne({ importId: importId.toString() });
    expect(photo?.storage.provider).toBe("cloudinary");
    expect(photo?.data).toBeUndefined();
    const photoDownloaded = await page.request.get(
      `/api/packaging-imports/${importId}/assets/${photo!._id}`,
    );
    expect((await photoDownloaded.body()).equals(photoBytes)).toBe(true);
    const csv = Buffer.from(
      "SKU,Product Name,Category,Packaging Type,Material,Total Weight (g),Components\nCLOUD-001,Cloudinary Test,Beverages,Bottle,PET,20,1\n",
    );
    const importResponse = await page.request.post("/api/packaging-imports", {
      headers,
      multipart: {
        file: {
          name: "cloudinary-test.csv",
          mimeType: "text/csv",
          buffer: csv,
        },
        settings: JSON.stringify(settings),
      },
    });
    expect(importResponse.status(), await importResponse.text()).toBe(200);
    uploadedImportId = (await importResponse.json()).id;
    const storedImport = await db
      .collection("packagingImports")
      .findOne({ _id: new ObjectId(uploadedImportId) });
    expect(storedImport?.file.storage.provider).toBe("cloudinary");
    expect(storedImport?.file.data).toBeUndefined();
    expect(
      await (
        await page.request.get(
          `/api/packaging-imports/${uploadedImportId}?download=true`,
        )
      ).text(),
    ).toBe(csv.toString());
    const componentId = analysis.rows[0].composition!.components[0].id;
    await db
      .collection("packagingClassifications")
      .insertOne({
        importId: importId.toString(),
        rowNumber,
        componentId,
        family: "Plastic",
      });
    const proofBase = `/api/packaging-imports/${importId}/proofs?rowNumber=${rowNumber}&componentId=${componentId}`;
    const proofResponse = await page.request.post(proofBase, {
      headers,
      multipart: {
        requirementId: "heavy",
        files: {
          name: "lab-proof.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\nCloudinary test"),
        },
      },
    });
    expect(proofResponse.status(), await proofResponse.text()).toBe(200);
    const proof = await db
      .collection("sustainabilityProofs")
      .findOne({ importId: importId.toString() });
    expect(proof?.storage.provider).toBe("cloudinary");
    expect(proof?.data).toBeUndefined();
    expect(
      (await page.request.get(`${proofBase}&file=${proof!._id}`)).status(),
    ).toBe(200);
    expect(
      (
        await page.request.put(path("ecommerce"), {
          headers,
          data: { ...payload, fields: { orders: -1 } },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await page.request.put(path("ecommerce"), {
          headers,
          data: { ...payload, rowNumber: analysis.rows[1].rowNumber },
        })
      ).status(),
    ).toBe(400);
    await db
      .collection("user")
      .updateOne({ _id: userId }, { $set: { role: "compliance" } });
    expect(
      (
        await page.request.get(`${path("ecommerce")}?rowNumber=${rowNumber}`)
      ).status(),
    ).toBe(200);
    expect(
      (
        await page.request.put(path("ecommerce"), { headers, data: payload })
      ).status(),
    ).toBe(403);
    expect(
      (
        await page.request.post("/api/uploads", {
          headers,
          multipart: {
            importId: importId.toString(),
            rowNumber: String(rowNumber),
            slot: "blocked-proof",
            file: {
              name: "evidence.csv",
              mimeType: "text/csv",
              buffer: Buffer.from("SKU,Weight\nTEST,10\n"),
            },
          },
        })
      ).status(),
    ).toBe(403);
  } finally {
    await cleanupCloudinaryTestFiles(db, importId.toString());
    await cleanupCloudinaryTestAvatar(db, userId);
    if (uploadedImportId) {
      await cleanupCloudinaryTestFiles(db, uploadedImportId);
      await db
        .collection("packagingImports")
        .deleteOne({ _id: new ObjectId(uploadedImportId) });
    }
    await db
      .collection("packagingAssets")
      .deleteMany({ importId: importId.toString() });
    await db
      .collection("sustainabilityProofs")
      .deleteMany({ importId: importId.toString() });
    await db
      .collection("packagingClassifications")
      .deleteMany({ importId: importId.toString() });
    await db
      .collection("mediaUploads")
      .deleteMany({ importId: importId.toString() });
    await db
      .collection("packagingDetailFiles")
      .deleteMany({ importId: importId.toString() });
    await db
      .collection("packagingDetails")
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
