import ExcelJS from "exceljs";
import { parse } from "csv-parse/sync";
import {
  importCategories,
  importFields,
  type ImportAnalysis,
  type ImportField,
  type ImportSettings,
  type ColumnMapping,
  type PackagingRow,
  type ImportIssue,
} from "./packaging-import-schema";
const normal = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
function validateWorkbookArchive(bytes: Buffer) {
  let end = -1;
  for (
    let offset = bytes.length - 22;
    offset >= Math.max(0, bytes.length - 65557);
    offset--
  ) {
    if (
      bytes.readUInt32LE(offset) === 0x06054b50 &&
      offset + 22 + bytes.readUInt16LE(offset + 20) === bytes.length
    ) {
      end = offset;
      break;
    }
  }
  if (end < 0) throw new Error("The XLSX archive is incomplete or invalid.");
  const entries = bytes.readUInt16LE(end + 10);
  let offset = bytes.readUInt32LE(end + 16),
    expanded = 0;
  if (entries > 1024)
    throw new Error("The XLSX workbook contains too many archive entries.");
  for (let index = 0; index < entries; index++) {
    if (offset + 46 > bytes.length || bytes.readUInt32LE(offset) !== 0x02014b50)
      throw new Error("The XLSX archive directory is invalid.");
    const size = bytes.readUInt32LE(offset + 24);
    expanded += size;
    if (size === 0xffffffff || expanded > 25 * 1024 * 1024)
      throw new Error(
        "The expanded XLSX workbook is too large. Use a simpler data-only workbook.",
      );
    if (bytes.readUInt16LE(offset + 8) & 1)
      throw new Error("Password-protected workbooks are not supported.");
    offset +=
      46 +
      bytes.readUInt16LE(offset + 28) +
      bytes.readUInt16LE(offset + 30) +
      bytes.readUInt16LE(offset + 32);
  }
}
const aliases: Record<ImportField, string[]> = {
  sku: ["sku", "skuid", "productsku", "productcode"],
  productName: ["productname", "product", "name", "productnamesku"],
  category: ["category", "productcategory"],
  packagingType: ["packagingtype", "packaging", "packtype"],
  material: ["material", "packagingmaterial"],
  weight: [
    "totalweightg",
    "totalweight",
    "weightg",
    "weight",
    "componentweight",
  ],
  components: ["components", "componentcount", "numberofcomponents"],
  labelCoverage: ["labelcoverage", "labelcoveragepercent"],
  adhesiveType: ["adhesivetype", "adhesive"],
  barrierLayer: ["barrierlayer", "barrierlayerdetails"],
  printingInk: ["printinginkdetails", "printingink", "ink"],
};
function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("result" in value) return String(value.result ?? "");
    if ("richText" in value) return value.richText.map((r) => r.text).join("");
    if ("text" in value) return value.text;
    if (value instanceof Date) return value.toISOString();
  }
  return String(value);
}
export async function parsePackagingFile(
  bytes: Buffer,
  name: string,
  settings: ImportSettings,
) {
  let matrix: string[][];
  if (name.toLowerCase().endsWith(".csv")) {
    matrix = parse(bytes.toString("utf8"), {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
      max_record_size: 50000,
    }).map((row: unknown[]) => row.map((v) => String(v ?? "")));
  } else if (name.toLowerCase().endsWith(".xlsx")) {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b)
      throw new Error("The file is not a valid XLSX workbook.");
    validateWorkbookArchive(bytes);
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(new Uint8Array(bytes) as unknown as ExcelJS.Buffer);
    const sheet = book.worksheets[0];
    if (!sheet) throw new Error("The workbook has no worksheet.");
    if (sheet.rowCount > 1001)
      throw new Error("Use a maximum of 1,000 data rows.");
    matrix = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const values: string[] = [];
      for (let i = 1; i <= Math.min(sheet.columnCount, 31); i++)
        values.push(cellText(row.getCell(i).value));
      matrix.push(values);
    });
  } else
    throw new Error(
      "Choose a CSV or XLSX file. Legacy XLS files are not supported.",
    );
  matrix = matrix.filter((row) => row.some((v) => v.trim()));
  if (!matrix.length) throw new Error("The uploaded file is empty.");
  if (matrix.length > (settings.firstRow === "headers" ? 1001 : 1000))
    throw new Error("Use a maximum of 1,000 data rows.");
  if (matrix.some((row) => row.length > 30))
    throw new Error("Use a maximum of 30 columns.");
  if (matrix.some((row) => row.some((cell) => cell.length > 200)))
    throw new Error("Cell values must be 200 characters or fewer.");
  const headers =
    settings.firstRow === "headers"
      ? matrix.shift()!.map((h, i) => h.trim() || `Column ${i + 1}`)
      : matrix[0].map((_, i) => `Column ${i + 1}`);
  if (new Set(headers).size !== headers.length)
    throw new Error("Column headers must be unique.");
  if (!matrix.length) throw new Error("Add at least one packaging data row.");
  const rawRows = matrix.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, (row[i] || "").trim()])),
  );
  const suggested: ColumnMapping = {};
  for (const field of importFields) {
    const match = headers.find((h) => aliases[field.key].includes(normal(h)));
    if (match) suggested[field.key] = match;
  }
  return { headers, rawRows, suggested };
}
const materials = [
  "PET",
  "HDPE",
  "LDPE",
  "PP",
  "PVC",
  "PS",
  "Plastic",
  "Paper",
  "Paper & board",
  "Cardboard",
  "Carton",
  "Glass",
  "Steel",
  "Aluminium",
  "Aluminum",
  "Metal",
  "Flexible Plastic",
  "Multi-layer (Plastic)",
  "PVC + PET",
  "Paper + PE",
  "Other",
];
export function analysePackaging(
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
  settings: ImportSettings,
): ImportAnalysis {
  const issues: ImportIssue[] = [];
  const seen = new Map<string, number[]>();
  rawRows.forEach((row, i) => {
    const sku = (row[mapping.sku || ""] || "").toLowerCase();
    if (sku) seen.set(sku, [...(seen.get(sku) || []), i]);
  });
  const rows: PackagingRow[] = rawRows.map((raw, index) => {
    const get = (key: ImportField) => raw[mapping[key] || ""] || "";
    const rowNumber = index + (settings.firstRow === "headers" ? 2 : 1);
    const sku = get("sku");
    const rowIssues: ImportIssue[] = [];
    const add = (field: string, message: string, kind: "missing" | "error") =>
      rowIssues.push({ row: rowNumber, sku, field, message, kind });
    const values = Object.fromEntries(
      importFields.map((f) => [f.key, get(f.key)]),
    ) as Record<ImportField, string>;
    if (settings.category !== "All Categories")
      values.category = settings.category;
    for (const field of importFields) {
      if (field.required && !values[field.key])
        add(field.label, `${field.label} is missing`, "missing");
    }
    const weight =
      values.weight && /^\d+(\.\d+)?$/.test(values.weight)
        ? Number(values.weight)
        : null;
    const components =
      values.components && /^\d+$/.test(values.components)
        ? Number(values.components)
        : null;
    if (values.weight && (weight === null || weight <= 0))
      add(
        "Total weight (g)",
        "Weight must be a positive number in grams",
        "error",
      );
    if (values.components && (components === null || components < 1))
      add("Components", "Components must be a positive whole number", "error");
    const material = materials.find(
      (m) => normal(m) === normal(values.material),
    );
    if (values.material && !material)
      add("Material", "Unrecognised material type", "error");
    const category = importCategories.find(
      (c) => normal(c) === normal(values.category),
    );
    if (values.category && !category)
      add("Category", "Unrecognised product category", "error");
    if (sku && (seen.get(sku.toLowerCase())?.length || 0) > 1)
      add("SKU", "Duplicate SKU in uploaded file", "error");
    if (
      values.labelCoverage &&
      (!/^\d+(\.\d+)?$/.test(values.labelCoverage) ||
        Number(values.labelCoverage) > 100)
    )
      add(
        "Label coverage (%)",
        "Label coverage must be between 0 and 100",
        "error",
      );
    issues.push(...rowIssues);
    return {
      rowNumber,
      sku,
      productName: values.productName,
      category: category || values.category,
      packagingType: values.packagingType,
      material: material || values.material,
      weight,
      components,
      labelCoverage: values.labelCoverage,
      adhesiveType: values.adhesiveType,
      barrierLayer: values.barrierLayer,
      printingInk: values.printingInk,
      status: rowIssues.some((i) => i.kind === "error")
        ? "error"
        : rowIssues.length
          ? "missing"
          : "complete",
      issues: rowIssues,
    };
  });
  const total = rows.length,
    complete = rows.filter((r) => r.status === "complete").length,
    missing = rows.filter((r) => r.status === "missing").length,
    errors = rows.filter((r) => r.status === "error").length;
  const missingFields = importFields
    .filter((f) => f.required)
    .map((f) => {
      const count = issues.filter(
        (i) => i.field === f.label && i.kind === "missing",
      ).length;
      return {
        field: f.label,
        count,
        impact: total ? Math.round((count / total) * 1000) / 10 : 0,
      };
    })
    .filter((f) => f.count > 0);
  const errorGroups = new Map<
    string,
    { field: string; message: string; count: number }
  >();
  for (const issue of issues.filter((i) => i.kind === "error")) {
    const key = issue.field + issue.message;
    const group = errorGroups.get(key) || {
      field: issue.field,
      message: issue.message,
      count: 0,
    };
    group.count++;
    errorGroups.set(key, group);
  }
  const families = new Set<ImportAnalysis["materialFamilies"][number]>();
  for (const row of rows) {
    const m = row.material.toLowerCase();
    if (!m) continue;
    families.add(
      m.includes("paper") || m.includes("card") || m === "carton"
        ? "Paper & board"
        : m === "glass"
          ? "Glass"
          : ["metal", "steel", "aluminium", "aluminum"].includes(m)
            ? "Metal"
            : m === "other"
              ? "Other"
              : "Plastic",
    );
  }
  return {
    rows,
    issues,
    summary: {
      total,
      complete,
      missing,
      errors,
      completeness: total ? Math.round((complete / total) * 100) : 0,
    },
    missingFields,
    validationErrors: [...errorGroups.values()],
    materialFamilies: [...families],
  };
}
