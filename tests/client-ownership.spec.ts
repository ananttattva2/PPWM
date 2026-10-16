import { test, expect } from "@playwright/test";
import { MongoClient, ObjectId } from "mongodb";
import { createHash, randomUUID } from "node:crypto";
import { setServers } from "node:dns";
import nextEnv from "@next/env";
import { analysePackaging } from "../src/lib/packaging-import";
import { initialComposition } from "../src/lib/packaging-composition";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
if (process.env.MONGODB_DNS_SERVERS)
  setServers(process.env.MONGODB_DNS_SERVERS.split(","));

test("users create/edit only their own clients; both administrator roles can access all", async ({
  browser,
}) => {
  test.setTimeout(180000);
  const mongo = new MongoClient(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 10000,
  });
  await mongo.connect();
  const database = mongo.db(process.env.MONGODB_DB);
  const suffix = randomUUID();
  const users = ["user", "user", "admin", "super_admin"].map((role, index) => ({
    _id: new ObjectId(),
    role,
    email: `ownership-${index}-${suffix}@example.invalid`,
    name: `Owner ${index}`,
    active: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  const contexts = [];
  const pages = [];
  const clientIds: ObjectId[] = [];
  const importIds: ObjectId[] = [];
  const origin = { Origin: "http://localhost:3000" };
  const profiles = ["Krishna", "Jack"].map((name) => ({
    legalName: `${name}-${suffix}`,
    tradeName: `${name} Trading`,
    gstNumber: "27ABCDE1234F1Z5",
    organisationRole: "Producer",
    registeredAddress: "12 Test Street, Mumbai 400001",
    email: `${name.toLowerCase()}-${suffix}@example.invalid`,
    telephone: "9876543210",
    authorisedPerson: name,
    country: "India",
    materials: [],
  }));
  try {
    await database.collection("user").insertMany(users);
    for (const user of users) {
      const otp = "739182";
      await database.collection("verification").insertOne({
        identifier: `sign-in-otp-${user.email}`,
        value: `${createHash("sha256").update(otp).digest("base64url")}:0`,
        expiresAt: new Date(Date.now() + 300000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const context = await browser.newContext();
      contexts.push(context);
      const page = await context.newPage();
      pages.push(page);
      let login = await page.request.post("/api/auth/sign-in/email-otp", {
        headers: origin,
        data: { email: user.email, otp },
      });
      if (login.status() === 429) {
        const retrySeconds = Number(login.headers()["x-retry-after"] || 60);
        await page.waitForTimeout((Math.min(retrySeconds, 60) + 1) * 1000);
        login = await page.request.post("/api/auth/sign-in/email-otp", {
          headers: origin,
          data: { email: user.email, otp },
        });
      }
      expect(login.status(), await login.text()).toBe(200);
    }
    for (const [index, profile] of profiles.entries()) {
      const response = await pages[index].request.post("/api/clients", {
        headers: origin,
        multipart: {
          data: JSON.stringify({
            ...profile,
            createdBy: users[1 - index]._id.toString(),
          }),
          documents: {
            name: "owner.pdf",
            mimeType: "application/pdf",
            buffer: Buffer.from("%PDF-1.7\nTest document"),
          },
        },
      });
      expect(response.status(), await response.text()).toBe(201);
      const id = new ObjectId((await response.json()).id);
      clientIds.push(id);
      expect(
        (await database.collection("clients").findOne({ _id: id }))?.createdBy,
      ).toBe(users[index]._id.toString());
      const importId = new ObjectId();
      importIds.push(importId);
      const settings = {
        category: "All Categories" as const,
        plant: "All Plants",
        firstRow: "headers" as const,
        updateExisting: true,
      };
      const analysis = analysePackaging(
        [
          {
            SKU: "S1",
            Product: "Test product",
            Category: "Beverages",
            Type: "Bottle",
            Weight: "10",
            Components: "1",
          },
        ],
        {
          sku: "SKU",
          productName: "Product",
          category: "Category",
          packagingType: "Type",
          weight: "Weight",
          components: "Components",
        },
        settings,
      );
      analysis.rows[0].composition = initialComposition(analysis.rows[0]);
      // An admin imported this packaging for the user-owned client. Client ownership controls access.
      await database.collection("packagingImports").insertOne({
        _id: importId,
        clientId: id.toString(),
        createdBy: users[2]._id.toString(),
        status: "confirmed",
        headers: [],
        mapping: {},
        rawRows: [],
        settings,
        analysis,
        file: { name: "test.csv", type: "CSV" },
      });
    }
    for (const index of [0, 1]) {
      const page = pages[index];
      const other = 1 - index;
      const list = await (await page.request.get("/api/clients")).json();
      expect(list.map((item: { _id: string }) => item._id)).toEqual([
        clientIds[index].toString(),
      ]);
      expect(
        (await page.request.get(`/api/clients/${clientIds[index]}`)).status(),
      ).toBe(200);
      expect(
        (await page.request.get(`/api/clients/${clientIds[other]}`)).status(),
      ).toBe(403);
      expect(
        (
          await page.request.get(`/api/clients/${clientIds[other]}/documents/0`)
        ).status(),
      ).toBe(403);
      expect(
        (
          await page.request.get(`/api/packaging-imports/${importIds[index]}`)
        ).status(),
      ).toBe(200);
      expect(
        (
          await page.request.get(`/api/packaging-imports/${importIds[other]}`)
        ).status(),
      ).toBe(403);
      expect(
        (
          await page.request.get(
            `/api/packaging-imports/${importIds[other]}?download=true`,
          )
        ).status(),
      ).toBe(403);
      expect(
        (
          await page.request.get(
            `/api/packaging-imports/${importIds[other]}/group-packaging`,
          )
        ).status(),
      ).toBe(403);
      const forbiddenEdit = await page.request.patch(
        `/api/clients/${clientIds[other]}`,
        {
          headers: origin,
          multipart: { data: JSON.stringify(profiles[other]) },
        },
      );
      expect(forbiddenEdit.status()).toBe(403);
      const forbiddenExemption = await page.request.put(
        `/api/clients/${clientIds[other]}/exemption`,
        { headers: origin, data: { answer: "yes" } },
      );
      expect(forbiddenExemption.status()).toBe(404);
      await page.goto("/dashboard/clients");
      await expect(
        page.getByRole("button", { name: "New client", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: `Edit client ${profiles[index].legalName}`,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByText(profiles[other].legalName, { exact: true }),
      ).toHaveCount(0);
      await page
        .getByRole("button", {
          name: `Edit client ${profiles[index].legalName}`,
          exact: true,
        })
        .click();
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await page
        .getByRole("textbox", { name: "Legal name", exact: true })
        .fill(`${profiles[index].legalName} Updated`);
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await page.getByRole("button", { name: "No", exact: true }).click();
      const savedResponse = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/clients/${clientIds[index]}`) &&
          response.request().method() === "PATCH",
      );
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      expect((await savedResponse).status()).toBe(200);
      await page.goto("/dashboard/clients");
      await expect(
        page.getByText(`${profiles[index].legalName} Updated`, { exact: true }),
      ).toBeVisible();
      expect(
        (
          await database
            .collection("clients")
            .findOne({ _id: clientIds[index] })
        )?.createdBy,
      ).toBe(users[index]._id.toString());
      await page.goto("/dashboard");
      await expect(
        page.getByText(profiles[other].legalName, { exact: true }),
      ).toHaveCount(0);
    }
    for (const index of [2, 3]) {
      const list = await (
        await pages[index].request.get("/api/clients")
      ).json();
      expect(list.map((item: { _id: string }) => item._id)).toEqual(
        expect.arrayContaining(clientIds.map(String)),
      );
      for (const id of clientIds)
        expect(
          (await pages[index].request.get(`/api/clients/${id}`)).status(),
        ).toBe(200);
      const response = await pages[index].request.patch(
        `/api/clients/${clientIds[0]}`,
        {
          headers: origin,
          multipart: {
            data: JSON.stringify({
              ...profiles[0],
              legalName: `${profiles[0].legalName} Admin edited`,
            }),
          },
        },
      );
      expect(response.status()).toBe(200);
    }
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
    await database.collection("clients").deleteMany({
      createdBy: { $in: users.map((user) => user._id.toString()) },
    });
    await database
      .collection("packagingImports")
      .deleteMany({ _id: { $in: importIds } });
    await database.collection("session").deleteMany({
      userId: { $in: users.map((user) => user._id.toString()) },
    });
    await database.collection("verification").deleteMany({
      identifier: { $in: users.map((user) => `sign-in-otp-${user.email}`) },
    });
    await database
      .collection("user")
      .deleteMany({ _id: { $in: users.map((user) => user._id) } });
    await mongo.close();
  }
});
