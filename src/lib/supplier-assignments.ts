import "server-only";
import { db } from "./db";
import { hydrateImportSuppliers } from "./hydrate-import-suppliers";
import { supplierRows } from "./supplier-access";

export async function supplierAssignments(email: string) {
  const records = db()
    .collection("packagingImports")
    .find({ status: "confirmed" }, { projection: { "file.data": 0 } });
  const assignments = [];
  for await (const record of records) {
    const hydrated = hydrateImportSuppliers({
      headers: record.headers,
      mapping: record.mapping || {},
      rawRows: record.rawRows,
      settings: record.settings,
      analysis: record.analysis,
    });
    const rows = supplierRows(hydrated.analysis.rows, email);
    if (rows.length)
      assignments.push({ importId: record._id.toString(), rows });
  }
  return assignments;
}
