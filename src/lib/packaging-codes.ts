import type { ColumnMapping } from "./packaging-import-schema";

const normalizedName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const codeToken = (value: string, length: number, fallback: string) => {
  const token = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, length);
  return token || fallback;
};

function yesNo(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "yes" ? "Yes" : normalized === "no" ? "No" : value;
}

function assignCodes(
  rows: Record<string, string>[],
  options: {
    nameHeader?: string;
    availableHeader?: string;
    codeHeader?: string;
    companyToken: string;
    fallback: string;
  },
) {
  const { nameHeader, availableHeader, codeHeader, companyToken, fallback } =
    options;
  if (!nameHeader || !availableHeader || !codeHeader) return;

  const supplied = new Map<string, string>();
  for (const row of rows) {
    const key = normalizedName(row[nameHeader] || "");
    const availability = yesNo(row[availableHeader] || "");
    row[availableHeader] = availability;
    const code = (row[codeHeader] || "").trim();
    if (key && availability === "Yes" && code && !supplied.has(key))
      supplied.set(key, code);
  }

  const generated = new Map<string, string>();
  const used = new Set(
    [...supplied.values()].map((code) => code.toUpperCase()),
  );
  for (const row of rows) {
    const name = row[nameHeader] || "";
    const key = normalizedName(name);
    if (!key) continue;
    const canonical = supplied.get(key);
    if (canonical) {
      row[codeHeader] = canonical;
      continue;
    }
    if (row[availableHeader] !== "No") continue;
    if (!generated.has(key)) {
      const nameToken = codeToken(name, 5, fallback);
      let sequence = 1;
      let candidate = "";
      do {
        candidate = `${companyToken}/${nameToken}/${String(sequence).padStart(3, "0")}`;
        sequence++;
      } while (used.has(candidate.toUpperCase()));
      used.add(candidate.toUpperCase());
      generated.set(key, candidate);
    }
    row[codeHeader] = generated.get(key)!;
  }
}

/**
 * Populate component and supplier codes before rows are grouped by SKU.
 * Codes are keyed only by the normalized component or supplier name. Material
 * is intentionally not part of the rule.
 */
export function applyPackagingCodes(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  companyName: string,
) {
  const companyToken = codeToken(companyName, 4, "CLNT");
  assignCodes(rows, {
    nameHeader: mapping.componentName,
    availableHeader: mapping.componentCodeAvailable,
    codeHeader: mapping.componentCode,
    companyToken,
    fallback: "COMPO",
  });
  assignCodes(rows, {
    nameHeader: mapping.supplierName,
    availableHeader: mapping.supplierCodeAvailable,
    codeHeader: mapping.supplierCode,
    companyToken,
    fallback: "SUPPL",
  });
}

/** Apply the same rules to either ordinary rows or SKU rows containing grouped component sources. */
export function applyPackagingCodesToImportRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  companyName: string,
) {
  const sourceKey = "__ppwr_component_rows";
  const grouped = rows.flatMap((row) => {
    if (!row[sourceKey]) return [row];
    return JSON.parse(row[sourceKey]) as Record<string, string>[];
  });
  applyPackagingCodes(grouped, mapping, companyName);
  let offset = 0;
  for (const row of rows) {
    if (!row[sourceKey]) {
      offset++;
      continue;
    }
    const count = (JSON.parse(row[sourceKey]) as unknown[]).length;
    row[sourceKey] = JSON.stringify(grouped.slice(offset, offset + count));
    offset += count;
  }
}
