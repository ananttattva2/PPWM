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
    await page
      .getByRole("textbox", { name: "Company name", exact: true })
      .fill(company);
    await page
      .getByRole("textbox", { name: "Contact name", exact: true })
      .fill("QA Contact");
    await page
      .getByRole("textbox", { name: "Contact email", exact: true })
      .fill(email);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByLabel("Plastic", { exact: true }).check();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
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
