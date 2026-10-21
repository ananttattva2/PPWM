import { test, expect, type BrowserContext } from "@playwright/test";
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
test("saved component progress, mandatory sections and company packaging permissions", async ({
  page,
  browser,
}) => {
  test.setTimeout(180000);
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  page.on("pageerror", (error) =>
    console.info("Browser error:", error.message),
  );
  const mongo = new MongoClient(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 10000,
  });
  await mongo.connect();
  const db = mongo.db(process.env.MONGODB_DB || "ppwm");
  const actorId = new ObjectId(),
    importId = new ObjectId();
  const email = `progress-${randomUUID()}@example.invalid`;
  let companyId = "",
    memberId = "";
  let memberContext: BrowserContext | undefined;
  const settings = {
    category: "All Categories" as const,
    plant: "All Plants",
    firstRow: "headers" as const,
    updateExisting: true,
  };
  const parsed = await parsePackagingFile(
    Buffer.from(
      "SKU,Product Name,Category,Packaging Type,Material,Total Weight (g),Components\nSKU-001,Progress Product,Beverages,Bottle,PET,23,1\n",
    ),
    "progress.csv",
    settings,
  );
  const analysis = analysePackaging(parsed.rawRows, parsed.suggested, settings);
  const row = analysis.rows[0];
  row.composition = initialComposition(row);
  row.composition.components = [
    {
      ...row.composition.components[0],
      id: "component-1",
      name: "Bottle",
      material: "PET",
      weight: "23",
      supplierName: "Progress supplier",
    },
  ];
  async function login(context: BrowserContext, loginEmail: string) {
    const otp = "739182";
    await db.collection("verification").insertOne({
      identifier: `sign-in-otp-${loginEmail}`,
      value: `${createHash("sha256").update(otp).digest("base64url")}:0`,
      expiresAt: new Date(Date.now() + 300000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const r = await context.request.post(
      "http://localhost:3000/api/auth/sign-in/email-otp",
      {
        headers: { Origin: "http://localhost:3000" },
        data: { email: loginEmail, otp },
      },
    );
    expect(r.status(), await r.text()).toBe(200);
  }
  try {
    await db.collection("user").insertOne({
      _id: actorId,
      email,
      name: "Progress Admin",
      firstName: "Progress",
      lastName: "Admin",
      role: "super_admin",
      active: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.collection("packagingImports").insertOne({
      _id: importId,
      createdBy: actorId.toString(),
      status: "confirmed",
      analysis,
      settings,
      headers: parsed.headers,
      mapping: parsed.suggested,
      rawRows: parsed.rawRows,
      file: { name: "progress.csv", type: "CSV" },
    });
    await login(page.context(), email);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const componentUrl = `/dashboard/packaging/${importId}/${row.rowNumber}/analyse?component=component-1`;
    await page.goto(componentUrl, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Supplier details", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Sustainability Checklist/ }),
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
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const db = await new Promise<IDBDatabase>((resolve) => {
            const r = indexedDB.open("ppwm-assessment-drafts", 1);
            r.onsuccess = () => resolve(r.result);
          });
          return new Promise<number>((resolve) => {
            const r = db.transaction("drafts").objectStore("drafts").count();
            r.onsuccess = () => resolve(r.result);
          });
        }),
      )
      .toBeGreaterThan(0);
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "What material is this component made from?",
        exact: true,
      }),
    ).toBeVisible();
    await page.goto(
      `/dashboard/packaging/${importId}/${row.rowNumber}/article-5?component=component-1`,
    );
    const panel = page.getByRole("tabpanel");
    await expect(
      page.getByRole("tab", { name: /Substances of concern/ }),
    ).toBeDisabled();
    await page.getByRole("tab", { name: /Material & construction/ }).click();
    await expect(
      page.getByRole("tab", { name: /Scope & identity/ }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(panel.getByRole("alert")).toContainText(
      "Complete all mandatory",
    );
    const selects = panel.locator("select:visible");
    await expect(selects).toHaveCount(4);
    await selects.nth(0).selectOption("Yes");
    for (let i = 1; i < 4; i++) await selects.nth(i).selectOption("No");
    await page.getByRole("button", { name: /Next section/ }).click();
    await expect(
      page.getByRole("tab", { name: /Scope & identity/ }),
    ).toHaveAttribute("aria-selected", "true");
    await selects.nth(0).selectOption("No");
    await page.getByRole("button", { name: /Next section/ }).click();
    await expect(
      page.getByRole("tab", { name: /Material & construction/ }),
    ).toHaveAttribute("aria-selected", "true");
    await page.reload();
    await expect(
      page.getByRole("tab", { name: /Material & construction/ }),
    ).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: /Scope & identity/ }).click();
    await expect(panel.locator("select:visible").first()).toHaveValue("No");
    await page.screenshot({
      path: "artifacts/progress-section-lock.png",
      fullPage: true,
    });
    console.info("Verified progress restoration and required section gates");
    await page.goto("/dashboard/users", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("columnheader", { name: "Packaging access", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: /Add team member/ }).click();
    await expect(
      page.getByRole("combobox", { name: /Packaging access/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "First name", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Initial password", { exact: false }),
    ).toBeVisible();

    const companyResponse = await page.request.post("/api/companies", {
      headers: { Origin: "http://localhost:3000" },
      data: {
        name: "Progress Company",
        email: `company-${email}`,
        packagingScopes: ["group", "transport"],
      },
    });
    expect(companyResponse.status()).toBe(201);
    companyId = (await companyResponse.json()).id;
    await db
      .collection("packagingImports")
      .updateOne({ _id: importId }, { $set: { clientId: companyId } });
    await page.goto("/dashboard/companies");
    const accessForm = page.getByRole("form", {
      name: "Company access",
      exact: true,
    });
    await expect(
      page.getByRole("textbox", { name: "Company name", exact: true }),
    ).toHaveCount(0);
    await expect(
      accessForm.getByRole("combobox", { name: "Role", exact: true }),
    ).toHaveCount(0);
    await expect(
      accessForm.getByRole("group", { name: "Packaging roles", exact: true }),
    ).toBeVisible();
    await expect(accessForm.getByRole("checkbox")).toHaveCount(8);
    for (const name of [
      "Sales Packaging",
      "Group Packaging",
      "Transport Packaging",
      "E-commerce",
      "Service Packaging",
      "Re-use / Refill",
      "Beverage / DRS",
      "Composite / Multi-material",
    ])
      await expect(
        accessForm.getByRole("checkbox", { name, exact: true }),
      ).toBeVisible();
    await accessForm
      .getByRole("combobox", { name: "Manage company", exact: true })
      .click();
    await page
      .getByRole("option", {
        name: `Progress Company · company-${email}`,
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("heading", { name: "Company users", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Add company user|Hide user form/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", {
        name: "No users assigned yet.",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      accessForm.getByRole("checkbox", {
        name: "Sales Packaging",
        exact: true,
      }),
    ).not.toBeChecked();
    await expect(
      accessForm.getByRole("checkbox", {
        name: "Group Packaging",
        exact: true,
      }),
    ).toBeChecked();
    const memberEmail = `member-${email}`;
    await accessForm
      .getByRole("textbox", { name: "User email", exact: true })
      .fill(memberEmail);
    const createdResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/users") &&
        response.request().method() === "POST",
    );
    await accessForm
      .getByRole("button", { name: "Create user", exact: true })
      .click();
    const created = await createdResponse;
    expect(created.status(), await created.text()).toBe(201);
    memberId = (await created.json()).id;
    const saved = await db
      .collection("user")
      .findOne({ _id: new ObjectId(memberId) });
    expect(saved?.role).toBe("user");
    expect(saved?.packagingScopes).toEqual(["group", "transport"]);
    await expect(
      page.getByRole("columnheader", { name: "Role", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("columnheader", { name: "Packaging roles", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: memberEmail, exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Initial password")).toHaveCount(0);
    await page.screenshot({
      path: "artifacts/company-management-consolidated.png",
      fullPage: true,
    });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.evaluate(() =>
      document.documentElement.setAttribute(
        "data-mantine-color-scheme",
        "dark",
      ),
    );
    await page.screenshot({
      path: "artifacts/company-management-consolidated-dark.png",
      fullPage: true,
    });
    console.info(
      "Verified company selector, single user form and refreshed company team",
    );
    memberContext = await browser.newContext();
    await login(memberContext, memberEmail);
    console.info("Company member signed in");
    const memberPage = await memberContext.newPage();
    await memberPage.emulateMedia({ reducedMotion: "reduce" });
    await memberPage.goto(
      `/dashboard/clients?packaging=${importId}&row=${row.rowNumber}`,
    );
    await expect(
      memberPage.getByRole("tab", { name: "Group Packaging", exact: true }),
    ).toBeVisible();
    await expect(
      memberPage.getByRole("tab", { name: "Transport Packaging", exact: true }),
    ).toBeVisible();
    await expect(
      memberPage.getByRole("tab", { name: "Sales Packaging", exact: true }),
    ).toHaveCount(0);
    await expect(
      memberPage.getByRole("tab", { name: "E-commerce", exact: true }),
    ).toHaveCount(0);
    await expect(
      memberPage.getByRole("link", { name: "Company management", exact: true }),
    ).toHaveCount(0);
    const denied = await memberContext.request.get(
      "http://localhost:3000/api/companies",
    );
    expect(denied.status()).toBe(403);
    const sales = await memberContext.request.put(
      `http://localhost:3000/api/packaging-imports/${importId}/classification`,
      {
        headers: { Origin: "http://localhost:3000" },
        data: {
          rowNumber: row.rowNumber,
          componentId: "component-1",
          family: "Plastic",
          categoryId: "pet-bottles",
        },
      },
    );
    expect(sales.status()).toBe(403);
    const group = await memberContext.request.get(
      `http://localhost:3000/api/packaging-imports/${importId}/group-packaging?rowNumber=${row.rowNumber}`,
    );
    expect(group.status(), await group.text()).toBe(200);
    const forbidden = await memberContext.request.get(
      `http://localhost:3000/api/packaging-imports/${importId}/details/ecommerce?rowNumber=${row.rowNumber}`,
    );
    expect(forbidden.status()).toBe(403);
    await memberPage.screenshot({
      path: "artifacts/company-packaging-access.png",
      fullPage: true,
    });
  } finally {
    await memberContext?.close();
    const ids = [actorId.toString(), memberId].filter(Boolean);
    await db.collection("session").deleteMany({ userId: { $in: ids } });
    await db.collection("account").deleteMany({ userId: { $in: ids } });
    await db
      .collection("user")
      .deleteMany({ _id: { $in: ids.map((id) => new ObjectId(id)) } });
    await db.collection("packagingImports").deleteOne({ _id: importId });
    if (companyId)
      await db
        .collection("clients")
        .deleteOne({ _id: new ObjectId(companyId) });
    await db.collection("verification").deleteMany({
      identifier: {
        $in: [`sign-in-otp-${email}`, `sign-in-otp-member-${email}`],
      },
    });
    await mongo.close();
  }
});
