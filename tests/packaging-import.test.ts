import { classificationSchema } from "../src/lib/packaging-classification";
import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { packagingAnalysis } from "../src/lib/packaging-analysis";
import {
  parsePackagingFile,
  analysePackaging,
} from "../src/lib/packaging-import";
import type { ImportSettings } from "../src/lib/packaging-import-schema";
import {
  compositionSchema,
  initialComposition,
  rowFields,
} from "../src/lib/packaging-composition";
const settings: ImportSettings = {
  category: "All Categories",
  plant: "Mumbai",
  firstRow: "headers",
  updateExisting: true,
};
const csv =
  "SKU,Product Name,Category,Packaging Type,Material,Total Weight (g),Components\nS1,Water,Beverages,Bottle,PET,23.5,3\nS2,Snacks,Snacks,Pouch,PP,,2\nS3,Soap,Personal Care,Bottle,UNKNOWN,-1,2\n";
test("saved packaging analysis reconciles weights without treating incomplete parts as a match", async () => {
  const parsed = await parsePackagingFile(
    Buffer.from(csv),
    "data.csv",
    settings,
  );
  const row = analysePackaging(parsed.rawRows, parsed.suggested, settings)
    .rows[0];
  const composition = initialComposition(row);
  const base = composition.components[0];
  row.components = 2;
  row.composition = {
    ...composition,
    components: [
      { ...base, id: "bottle", material: "PET", weight: "21" },
      { ...base, id: "cap", material: "PP", weight: "2.5" },
    ],
  };
  const analysis = packagingAnalysis(row);
  assert.equal(analysis.total, 23.5);
  assert.equal(analysis.matches, true);
  assert.equal(analysis.countMatches, true);
  assert.equal(analysis.materials.length, 2);
  assert.ok(
    Math.abs(
      analysis.materials.reduce(
        (sum, material) => sum + material.percentage,
        0,
      ) - 100,
    ) < 0.0001,
  );
  row.composition.components[1].weight = "";
  assert.equal(packagingAnalysis(row).matches, false);
  assert.equal(packagingAnalysis(row).weightsComplete, false);
  assert.equal(
    packagingAnalysis({ ...row, composition: undefined }).matches,
    false,
  );
});
test("composition drafts preserve source values without inventing component weights", async () => {
  const parsed = await parsePackagingFile(
    Buffer.from(csv),
    "data.csv",
    settings,
  );
  const row = analysePackaging(parsed.rawRows, parsed.suggested, settings)
    .rows[0];
  const draft = initialComposition(row);
  assert.equal(draft.components[0].weight, "");
  assert.equal(rowFields(row).weight, "23.5");
  assert.equal(Object.keys(rowFields(row)).length, 12);
  assert.ok(compositionSchema.safeParse(draft).success);
  assert.ok(
    !compositionSchema.safeParse({
      ...draft,
      components: [draft.components[0], draft.components[0]],
    }).success,
  );
  assert.ok(
    !compositionSchema.safeParse({
      ...draft,
      components: [{ ...draft.components[0], weight: "-1" }],
    }).success,
  );
  const saved = { ...draft, brand: "Saved brand" };
  assert.equal(
    initialComposition({ ...row, composition: saved }).brand,
    "Saved brand",
  );
});
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
      (e) => e.message === "Unrecognised polymer type",
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

test("prefixed XLSX exports map all 12 headers and flag blank detail cells", async () => {
  const { default: JSZip } = await import("jszip");
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Packaging");
  sheet.addRow([
    "Product Name",
    "SKU",
    "Category",
    "Packaging Type",
    "Material",
    "Total Weight (g)",
    "Components",
    "Label Coverage (%)",
    "Adhesive Type",
    "Barrier Layer Details",
    "Component Weight (g)",
    "Printing / Ink Details",
  ]);
  sheet.addRow([
    "Water",
    "X1",
    "Beverages",
    "Bottle",
    "PET",
    23.5,
    3,
    80,
    "Acrylic",
    "None",
    20.5,
    "Water-based",
  ]);
  sheet.addRow(["Snack", "X2", "Snacks", "Pouch", "PP", 6.8, 2]);
  const zip = await JSZip.loadAsync(await book.xlsx.writeBuffer());
  for (const name of ["xl/workbook.xml", "xl/worksheets/sheet1.xml"]) {
    const xml = await zip.file(name)!.async("string");
    zip.file(
      name,
      xml
        .replace(
          'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
          'xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
        )
        .replace(/(<\/?)([A-Za-z][\w]*)(?=[\s/>])/g, "$1x:$2"),
    );
  }
  const parsed = await parsePackagingFile(
    await zip.generateAsync({ type: "nodebuffer" }),
    "prefixed.xlsx",
    settings,
  );
  assert.equal(Object.keys(parsed.suggested).length, 12);
  const result = analysePackaging(parsed.rawRows, parsed.suggested, settings);
  assert.equal(result.rows[0].weight, 23.5);
  assert.equal(result.rows[0].componentWeight, 20.5);
  assert.equal(result.summary.complete, 1);
  assert.equal(result.summary.missing, 1);
  assert.equal(result.missingFields.length, 5);
});

test("Polymer spreadsheet headers map to the existing material data field", async () => {
  const parsed = await parsePackagingFile(
    Buffer.from(
      "SKU,Product Name,Category,Packaging Type,Polymer,Total Weight (g),Components\nP1,Bottle,Food,Bottle,PET,10,1\n",
    ),
    "polymer.csv",
    settings,
  );
  assert.equal(parsed.suggested.material, "Polymer");
  assert.equal(
    analysePackaging(parsed.rawRows, parsed.suggested, settings).rows[0]
      .material,
    "PET",
  );
});

test("Component classification accepts matching categories and rejects cross-material selections", () => {
  const input = {
    rowNumber: 2,
    componentId: "main",
    family: "Plastic",
    categoryId: "pet-bottles",
  };
  assert.equal(classificationSchema.safeParse(input).success, true);
  assert.equal(
    classificationSchema.safeParse({ ...input, family: "Glass" }).success,
    false,
  );
  assert.equal(
    classificationSchema.safeParse({ ...input, family: "Multi-material" })
      .success,
    true,
  );
  assert.equal(
    classificationSchema.safeParse({ ...input, categoryId: "unknown" }).success,
    false,
  );
});
