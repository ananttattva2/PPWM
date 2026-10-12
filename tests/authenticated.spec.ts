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
  test.setTimeout(90000);
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);
  const id = new ObjectId();
  const email = `qa-${randomUUID()}@example.invalid`;
  const company = `QA-${randomUUID()}`;
  let createdUserEmail = "";
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
    await page
      .getByRole("textbox", { name: "Legal name", exact: true })
      .fill(company);
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
    await page.screenshot({
      path: "artifacts/client-onboarding.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
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
    await page.getByLabel("Plastic", { exact: true }).check();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    const savedClient = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/clients") && r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Create client", exact: true })
      .click();
    expect((await savedClient).status()).toBe(201);
    await expect(page.getByText(company, { exact: true })).toBeVisible();
    expect(await db.collection("clients").countDocuments({ company })).toBe(1);
    await expect(
      page.getByText("Client created successfully", { exact: true }),
    ).toBeVisible();
    const storedClient = await db.collection("clients").findOne({ company });
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
    await db
      .collection("user")
      .updateOne({ _id: id }, { $set: { role: "user" } });
    const denied = await page.request.get("/api/users");
    expect(denied.status()).toBe(403);
    await db
      .collection("user")
      .updateOne({ _id: id }, { $set: { active: false } });
    expect((await page.request.get("/api/clients")).status()).toBe(401);
  } finally {
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
