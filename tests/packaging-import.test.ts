import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {
  parsePackagingFile,
  analysePackaging,
} from "../src/lib/packaging-import";
import type { ImportSettings } from "../src/lib/packaging-import-schema";
const settings: ImportSettings = {
  category: "All Categories",
  plant: "Mumbai",
  firstRow: "headers",
  updateExisting: true,
};
const csv =
  "SKU,Product Name,Category,Packaging Type,Material,Total Weight (g),Components\nS1,Water,Beverages,Bottle,PET,23.5,3\nS2,Snacks,Snacks,Pouch,PP,,2\nS3,Soap,Personal Care,Bottle,UNKNOWN,-1,2\n";
test("CSV parsing detects real completeness, missing data and validation errors", async () => {
  const parsed = await parsePackagingFile(
    Buffer.from(csv),
    "data.csv",
    settings,
  );
  const result = analysePackaging(parsed.rawRows, parsed.suggested, settings);
  assert.deepEqual(result.summary, {
    total: 3,
    complete: 1,
    missing: 1,
    errors: 1,
    completeness: 33,
  });
  assert.equal(result.missingFields[0].field, "Total weight (g)");
  assert.ok(
    result.validationErrors.some(
      (e) => e.message === "Unrecognised material type",
    ),
  );
  assert.equal(result.rows[0].weight, 23.5);
});
test("quoted CSV content, explicit mapping and category settings work", async () => {
  const parsed = await parsePackagingFile(
    Buffer.from(
      'Code,Name,Type,Polymer,Grams,Parts\nX1,"Water, still",Bottle,PET,20,3\n',
    ),
    "mapped.csv",
    settings,
  );
  const result = analysePackaging(
    parsed.rawRows,
    {
      sku: "Code",
      productName: "Name",
      packagingType: "Type",
      material: "Polymer",
      weight: "Grams",
      components: "Parts",
    },
    { ...settings, category: "Beverages" },
  );
  assert.equal(result.summary.complete, 1);
  assert.equal(result.rows[0].productName, "Water, still");
  assert.equal(result.rows[0].category, "Beverages");
});
test("XLSX parsing uses the first worksheet and preserves numeric weights", async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Packaging");
  sheet.addRow([
    "SKU",
    "Product Name",
    "Category",
    "Packaging Type",
    "Material",
    "Weight",
    "Components",
  ]);
  sheet.addRow(["X1", "Water", "Beverages", "Bottle", "PET", 23.5, 3]);
  const bytes = await workbook.xlsx.writeBuffer();
  const parsed = await parsePackagingFile(
    Buffer.from(bytes),
    "data.xlsx",
    settings,
  );
  assert.equal(
    analysePackaging(parsed.rawRows, parsed.suggested, settings).summary
      .complete,
    1,
  );
});
test("duplicates are flagged for both rows and empty/legacy files are rejected", async () => {
  const parsed = await parsePackagingFile(
    Buffer.from(csv.replace("S2,", "S1,")),
    "duplicate.csv",
    settings,
  );
  assert.equal(
    analysePackaging(parsed.rawRows, parsed.suggested, settings).issues.filter(
      (i) => i.message === "Duplicate SKU in uploaded file",
    ).length,
    2,
  );
  await assert.rejects(
    () => parsePackagingFile(Buffer.from(""), "empty.csv", settings),
    /empty/,
  );
  await assert.rejects(
    () => parsePackagingFile(Buffer.from("abc"), "legacy.xls", settings),
    /CSV or XLSX/,
  );
});
test("oversized XLSX archives are rejected before decompression", async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet("Packaging").addRow(["SKU"]);
  const bytes = Buffer.from(await workbook.xlsx.writeBuffer());
  const central = bytes.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  assert.ok(central >= 0);
  bytes.writeUInt32LE(30 * 1024 * 1024, central + 24);
  await assert.rejects(
    () => parsePackagingFile(bytes, "oversized.xlsx", settings),
    /expanded XLSX workbook is too large/,
  );
});
