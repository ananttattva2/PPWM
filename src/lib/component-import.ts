import type { ColumnMapping, ImportField } from "./packaging-import-schema";
import type { PackagingComposition } from "./packaging-composition";
export const COMPONENT_SOURCE = "__ppwr_component_rows";
export const productImportKeys: ImportField[] = [
  "sku",
  "productName",
  "category",
  "packagingType",
  "weight",
  "components",
];
export const componentImportKeys: ImportField[] = [
  "componentName",
  "material",
  "componentWeight",
  "foodGrade",
  "supplierName",
  "supplierAddress",
  "supplierContactNumber",
  "supplierEmail",
  "supplierAuthorisedPersonName",
  "labelCoverage",
  "adhesiveType",
  "barrierLayer",
  "printingInk",
];
export function uniqueComponentCount(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
) {
  const header = mapping.componentName;
  if (!header) return rows.length;
  return new Set(
    rows.map((row) => (row[header] || "").trim().toLowerCase()).filter(Boolean),
  ).size;
}
export function componentSources(
  row: Record<string, string>,
): Record<string, string>[] | null {
  return row[COMPONENT_SOURCE] ? JSON.parse(row[COMPONENT_SOURCE]) : null;
}
export function groupComponentRows(
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
) {
  if (!mapping.componentName || rawRows.some((row) => row[COMPONENT_SOURCE]))
    return rawRows;
  const groups = new Map<string, Record<string, string>[]>();
  rawRows.forEach((row, index) => {
    const sku = (row[mapping.sku || ""] || "").trim().toLowerCase();
    const key = sku || `__missing_sku_${index}`;
    groups.set(key, [...(groups.get(key) || []), row]);
  });
  return [...groups.values()].map((rows) => {
    if (rows.length > 30)
      throw new Error("Each SKU can have a maximum of 30 component rows.");
    const canonical = { ...rows[0] };
    for (const key of productImportKeys) {
      const header = mapping[key];
      if (header)
        canonical[header] =
          rows.find((row) => row[header]?.trim())?.[header] || "";
    }
    if (mapping.components && !canonical[mapping.components])
      canonical[mapping.components] = String(
        uniqueComponentCount(rows, mapping),
      );
    if (
      mapping.weight &&
      !canonical[mapping.weight] &&
      mapping.componentWeight &&
      rows.every((row) =>
        /^\d+(\.\d+)?$/.test(row[mapping.componentWeight!] || ""),
      )
    )
      canonical[mapping.weight] = String(
        rows.reduce(
          (sum, row) => sum + Number(row[mapping.componentWeight!]),
          0,
        ),
      );
    canonical[COMPONENT_SOURCE] = JSON.stringify(rows);
    return canonical;
  });
}
/** Keep component spreadsheet sources in sync when the SKU editor saves. */
export function syncComponentSources(
  raw: Record<string, string>,
  mapping: ColumnMapping,
  headers: string[],
  composition: PackagingComposition,
) {
  if (!raw[COMPONENT_SOURCE]) return;
  const sources = composition.components.map((component) => {
    const source = { ...raw };
    delete source[COMPONENT_SOURCE];
    const values: Partial<Record<ImportField, string>> = {
      ...component,
      componentName: component.name,
      componentWeight: component.weight,
    };
    for (const key of componentImportKeys) {
      if (!mapping[key] && values[key]) {
        let header = key;
        while (headers.includes(header)) header += " (edited)";
        headers.push(header);
        mapping[key] = header;
      }
      if (mapping[key]) source[mapping[key]!] = values[key] || "";
    }
    return source;
  });
  raw[COMPONENT_SOURCE] = JSON.stringify(sources);
}
