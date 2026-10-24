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
  assert.equal(Object.keys(rowFields(row)).length, 19);
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
import {
  packagingTemplateCsv,
  packagingTemplateFields,
} from "../src/lib/packaging-import-template";
import { packagingTemplateWorkbook } from "../src/lib/packaging-import-workbook";
import {
  componentSources,
  groupComponentRows,
  syncComponentSources,
} from "../src/lib/component-import";
import {
  compositionUpdateSchema,
  distinctPhysicalComponents,
} from "../src/lib/packaging-composition";
async function componentTemplate() {
  return parsePackagingFile(
    Buffer.from(packagingTemplateCsv()),
    "components.csv",
    settings,
  );
}
test("component rows group into two SKUs with independent suppliers and correct weights", async () => {
  const parsed = await componentTemplate();
  const analysis = analysePackaging(parsed.rawRows, parsed.suggested, settings);
  assert.equal(parsed.headers.includes("Polymer"), false);
  assert.equal(parsed.headers.length, 18);
  assert.equal(parsed.rawRows.length, 2);
  assert.deepEqual(analysis.summary, {
    total: 2,
    complete: 2,
    missing: 0,
    errors: 0,
    completeness: 100,
  });
  const water = analysis.rows[0];
  assert.equal(water.weight, 23.5);
  assert.equal(water.components, 3);
  assert.equal(water.componentSuppliers, true);
  assert.equal(water.supplierName, "");
  assert.deepEqual(
    water.composition!.components.map((c) => [
      c.name,
      c.supplierName,
      c.weight,
    ]),
    [
      ["Bottle", "Bottle Supplier", "20"],
      ["Cap", "Cap Supplier", "2.5"],
      ["Label", "Label Supplier", "1"],
    ],
  );
  assert.equal(analysis.rows[1].composition!.components.length, 4);
  assert.equal(
    water.composition!.components[1].supplierEmail,
    "caps@example.com",
  );
  assert.ok(
    compositionUpdateSchema.safeParse({
      rowNumber: water.rowNumber,
      fields: rowFields(water),
      composition: water.composition,
    }).success,
  );
});
test("Excel template has seven component rows, instructions, dropdowns and CSV-equivalent import", async () => {
  const book = packagingTemplateWorkbook();
  const sheet = book.worksheets[0];
  assert.equal(book.worksheets[1].name, "Instructions");
  const foodCol =
    packagingTemplateFields.findIndex((field) => field.key === "foodGrade") + 1;
  assert.equal(sheet.getCell(2, foodCol).dataValidation.type, "list");
  const bytes = Buffer.from(await book.xlsx.writeBuffer());
  const xlsx = await parsePackagingFile(bytes, "template.xlsx", settings);
  const csv = await componentTemplate();
  assert.deepEqual(
    analysePackaging(xlsx.rawRows, xlsx.suggested, settings),
    analysePackaging(csv.rawRows, csv.suggested, settings),
  );
});
test("component validation identifies supplier errors, count mismatches and conflicting SKU fields", async () => {
  const parsed = await componentTemplate();
  const supplierAlternatives = componentSources(parsed.rawRows[0])!;
  supplierAlternatives.push({
    ...supplierAlternatives[0],
    "Supplier Name": "Alternative Bottle Supplier",
    "Supplier Email": "alternative-bottle@example.com",
  });
  const alternatives = analysePackaging(
    groupComponentRows(supplierAlternatives, parsed.suggested),
    parsed.suggested,
    settings,
  );
  assert.equal(
    alternatives.issues.some((issue) =>
      issue.message.includes("Duplicate component"),
    ),
    false,
  );
  assert.equal(
    alternatives.issues.some((issue) => issue.field === "Components"),
    false,
  );
  const physicalComponents = distinctPhysicalComponents(
    alternatives.rows[0].composition!.components,
  );
  assert.equal(physicalComponents.length, 3);
  assert.equal(
    physicalComponents.reduce(
      (total, component) => total + Number(component.weight),
      0,
    ),
    23.5,
  );
  const sources = componentSources(parsed.rawRows[0])!;
  sources[1]["Supplier Email"] = "bad-email";
  sources[1]["Food Grade (Yes/No)"] = "Maybe";
  sources[1]["Supplier Contact Number"] = "bad phone";
  const grouped = groupComponentRows(sources, parsed.suggested);
  const invalid = analysePackaging(grouped, parsed.suggested, settings);
  assert.equal(invalid.rows[0].status, "error");
  assert.equal(invalid.issues.length, 3);
  assert.ok(invalid.issues.every((i) => i.message.startsWith("Cap:")));
  sources[1]["Total weight (g)"] = "100";
  sources[1]["Component Name"] = "Bottle";
  const conflicts = analysePackaging(
    groupComponentRows(sources, parsed.suggested),
    parsed.suggested,
    settings,
  );
  assert.equal(
    conflicts.issues.some((i) => i.message.includes("Duplicate component")),
    false,
  );
  assert.ok(conflicts.issues.some((i) => i.message.includes("must agree")));
  const count = analysePackaging(
    groupComponentRows(
      componentSources(parsed.rawRows[0])!.slice(0, 2),
      parsed.suggested,
    ),
    parsed.suggested,
    settings,
  );
  assert.ok(count.issues.some((i) => i.field === "Components"));
});
test("saving component supplier edits and removals survives revalidation without replacing other suppliers", async () => {
  const parsed = await componentTemplate();
  const analysis = analysePackaging(parsed.rawRows, parsed.suggested, settings);
  const composition = analysis.rows[0].composition!;
  composition.components[1].supplierName = "New Cap Supplier";
  composition.components[1].supplierContactNumber = "00919876543210";
  syncComponentSources(
    parsed.rawRows[0],
    parsed.suggested,
    parsed.headers,
    composition,
  );
  const restored = analysePackaging(parsed.rawRows, parsed.suggested, settings)
    .rows[0];
  assert.equal(
    restored.composition!.components[1].supplierName,
    "New Cap Supplier",
  );
  assert.equal(
    restored.composition!.components[1].supplierContactNumber,
    "00919876543210",
  );
  assert.equal(
    restored.composition!.components[0].supplierName,
    "Bottle Supplier",
  );
  composition.components.pop();
  parsed.rawRows[0][parsed.suggested.components!] = "2";
  syncComponentSources(
    parsed.rawRows[0],
    parsed.suggested,
    parsed.headers,
    composition,
  );
  const removed = analysePackaging(parsed.rawRows, parsed.suggested, settings)
    .rows[0];
  assert.equal(removed.status, "complete");
  assert.equal(removed.composition!.components.length, 2);
});
test("component imports can inherit repeated product values and reject reserved headers", async () => {
  const parsed = await componentTemplate();
  const sources = componentSources(parsed.rawRows[0])!;
  for (const source of sources.slice(1))
    for (const key of [
      "Product name",
      "Category",
      "Packaging type",
      "Total weight (g)",
      "Components",
    ])
      source[key] = "";
  assert.equal(
    analysePackaging(
      groupComponentRows(sources, parsed.suggested),
      parsed.suggested,
      settings,
    ).rows[0].status,
    "complete",
  );
  await assert.rejects(
    () =>
      parsePackagingFile(
        Buffer.from("SKU,__ppwr_component_rows\nS1,malicious\n"),
        "bad.csv",
        settings,
      ),
    /reserved/,
  );
});
import { resolvePackagingMapping } from "../src/lib/packaging-import";
import { hydrateImportSuppliers } from "../src/lib/hydrate-import-suppliers";
test("older mappings inherit new supplier headers but preserve deliberate unmapped fields", async () => {
  const parsed = await componentTemplate();
  const old = {
    sku: parsed.suggested.sku,
    productName: parsed.suggested.productName,
    category: parsed.suggested.category,
    packagingType: parsed.suggested.packagingType,
    weight: parsed.suggested.weight,
    components: parsed.suggested.components,
  };
  const mapping = resolvePackagingMapping(parsed.headers, old);
  assert.equal(mapping.supplierName, "Supplier Name");
  assert.equal(mapping.foodGrade, "Food Grade (Yes/No)");
  assert.equal(mapping.componentName, "Component Name");
  assert.equal(
    resolvePackagingMapping(parsed.headers, { ...old, supplierEmail: "" })
      .supplierEmail,
    undefined,
  );
  assert.throws(
    () =>
      resolvePackagingMapping(parsed.headers, {
        supplierName: "Missing column",
      }),
    /not present/,
  );
  const reprocessed = analysePackaging(parsed.rawRows, mapping, settings);
  assert.equal(
    reprocessed.rows[0].composition!.components[1].supplierName,
    "Cap Supplier",
  );
});
test("saved legacy SKU imports recover supplier data from original spreadsheet without replacing edits", async () => {
  const parsed = await parsePackagingFile(
    Buffer.from(
      "SKU,Product Name,Category,Packaging Type,Total Weight (g),Components,Food Grade (Yes/No),Supplier Name,Supplier Address,Supplier Contact Number,Supplier Email,Supplier Authorised Person Name\nS1,Water,Beverages,Bottle,23.5,3,Yes,Bottle Supplier,Mumbai,00919876543210,bottles@example.com,Bottle Contact\n",
    ),
    "old.csv",
    settings,
  );
  const {
    foodGrade,
    supplierName,
    supplierAddress,
    supplierContactNumber,
    supplierEmail,
    supplierAuthorisedPersonName,
    ...oldMapping
  } = parsed.suggested;
  const stale = analysePackaging(parsed.rawRows, oldMapping, settings);
  assert.equal(stale.rows[0].supplierName, "");
  stale.rows[0].productName = "Edited product title";
  const record = {
    headers: parsed.headers,
    mapping: oldMapping,
    rawRows: parsed.rawRows,
    settings,
    analysis: stale,
  };
  const before = JSON.stringify(record);
  const fixed = hydrateImportSuppliers(record);
  assert.equal(fixed.analysis.rows[0].supplierName, "Bottle Supplier");
  assert.equal(fixed.analysis.rows[0].supplierContactNumber, "00919876543210");
  assert.equal(fixed.analysis.rows[0].supplierEmail, "bottles@example.com");
  assert.equal(
    fixed.analysis.rows[0].supplierAuthorisedPersonName,
    "Bottle Contact",
  );
  assert.equal(fixed.analysis.rows[0].foodGrade, "Yes");
  assert.equal(fixed.analysis.rows[0].productName, "Edited product title");
  assert.equal(JSON.stringify(record), before);
});
test("saved component suppliers recover independently while photos and explicit edits remain intact", async () => {
  const parsed = await componentTemplate();
  const analysis = analysePackaging(parsed.rawRows, parsed.suggested, settings);
  for (const row of analysis.rows)
    for (const component of row.composition!.components) {
      component.supplierName = undefined;
      component.supplierAddress = undefined;
      component.supplierContactNumber = undefined;
      component.supplierEmail = undefined;
      component.supplierAuthorisedPersonName = undefined;
      component.foodGrade = undefined;
    }
  const bottle = analysis.rows[0].composition!.components[0];
  bottle.supplierName = "Edited Bottle Supplier";
  bottle.image = "123456789012345678901234";
  analysis.rows[0].composition!.components[1].supplierEmail = "";
  const repaired = hydrateImportSuppliers({
    ...parsed,
    mapping: parsed.suggested,
    settings,
    analysis,
  });
  const components = repaired.analysis.rows[0].composition!.components;
  assert.equal(components[0].supplierName, "Edited Bottle Supplier");
  assert.equal(components[0].image, "123456789012345678901234");
  assert.equal(components[1].supplierName, "Cap Supplier");
  assert.equal(components[1].supplierEmail, "");
  assert.equal(components[2].supplierName, "Label Supplier");
  assert.equal(components[1].foodGrade, "Yes");
});
test("custom component mapping groups original rows only after final column choices", async () => {
  const parsed = await parsePackagingFile(
    Buffer.from(packagingTemplateCsv()),
    "components.csv",
    settings,
    false,
  );
  assert.equal(parsed.rawRows.length, 7);
  const mapped = resolvePackagingMapping(parsed.headers, {});
  const grouped = groupComponentRows(parsed.rawRows, mapped);
  assert.equal(grouped.length, 2);
  assert.equal(
    analysePackaging(grouped, mapped, settings).rows[0].composition!
      .components[2].supplierName,
    "Label Supplier",
  );
});
