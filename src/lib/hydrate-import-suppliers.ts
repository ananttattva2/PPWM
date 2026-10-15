import { analysePackaging, resolvePackagingMapping } from "./packaging-import";
import type {
  ColumnMapping,
  ImportAnalysis,
  ImportSettings,
} from "./packaging-import-schema";
const supplierKeys = [
  "foodGrade",
  "supplierName",
  "supplierAddress",
  "supplierContactNumber",
  "supplierEmail",
  "supplierAuthorisedPersonName",
] as const;
/** Recover newly supported columns from saved source data without changing saved edits or photos. */
export function hydrateImportSuppliers(record: {
  headers: string[];
  mapping: ColumnMapping;
  rawRows: Record<string, string>[];
  settings: ImportSettings;
  analysis: ImportAnalysis;
}) {
  const mapping = resolvePackagingMapping(record.headers, record.mapping);
  const recovered = analysePackaging(record.rawRows, mapping, record.settings);
  const rows = record.analysis.rows.map((saved) => {
    const source = recovered.rows.find(
      (row) =>
        row.rowNumber === saved.rowNumber &&
        row.sku.toLowerCase() === saved.sku.toLowerCase(),
    );
    if (!source) return saved;
    const next = { ...saved };
    for (const key of supplierKeys)
      if (
        saved[key] === undefined ||
        (!saved[key] && !Object.hasOwn(record.mapping, key))
      )
        next[key] = source[key];
    if (source.componentSuppliers && source.composition) {
      next.componentSuppliers = true;
      if (!saved.composition) next.composition = source.composition;
      else
        next.composition = {
          ...saved.composition,
          components: saved.composition.components.map((component) => {
            const original =
              source.composition!.components.find(
                (candidate) => candidate.id === component.id,
              ) ||
              source.composition!.components.find(
                (candidate) =>
                  candidate.name.trim().toLowerCase() ===
                  component.name.trim().toLowerCase(),
              );
            if (!original) return component;
            const restored = { ...component };
            for (const key of supplierKeys)
              if (
                component[key] === undefined ||
                (!component[key] && !Object.hasOwn(record.mapping, key))
              )
                restored[key] = original[key];
            return restored;
          }),
        };
    }
    return next;
  });
  return { mapping, analysis: { ...record.analysis, rows } };
}
