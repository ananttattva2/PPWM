import type { PackagingRow } from "./packaging-import-schema";
import type { CompositionComponent } from "./packaging-composition";

export function supplierOwnsComponent(
  email: string,
  component: Pick<CompositionComponent, "supplierEmail">,
) {
  const normalized = email.trim().toLowerCase();
  return Boolean(
    normalized && component.supplierEmail?.trim().toLowerCase() === normalized,
  );
}

export function supplierRows(
  rows: PackagingRow[],
  email: string,
): PackagingRow[] {
  return rows.flatMap((row) => {
    const components =
      row.composition?.components.filter((component) =>
        supplierOwnsComponent(email, component),
      ) || [];
    if (!components.length || !row.composition) return [];
    // Return only supplier-owned component data, never the original row's supplier details or issues.
    return [
      {
        rowNumber: row.rowNumber,
        sku: row.sku,
        productName: row.productName,
        category: row.category,
        packagingType: row.packagingType,
        material: "",
        weight: null,
        components: components.length,
        labelCoverage: "",
        adhesiveType: "",
        barrierLayer: "",
        componentWeight: null,
        printingInk: "",
        status: "complete" as const,
        issues: [],
        composition: { ...row.composition, components },
      },
    ];
  });
}

export function supplierCanReadAsset(
  rows: PackagingRow[],
  email: string,
  assetId: string,
) {
  return supplierRows(rows, email).some((row) => {
    const composition = row.composition!;
    return (
      composition.productImage === assetId ||
      composition.productImages.includes(assetId) ||
      composition.components.some((component) => component.image === assetId)
    );
  });
}
