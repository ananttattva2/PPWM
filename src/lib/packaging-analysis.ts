import { importFields, type PackagingRow } from "./packaging-import-schema";
export function packagingAnalysis(row: PackagingRow) {
  const components = row.composition?.components || [];
  const total = components.reduce(
    (sum, component) => sum + (Number(component.weight) || 0),
    0,
  );
  const expected = row.weight;
  const weightsComplete =
    components.length > 0 &&
    components.every((component) => Number(component.weight) > 0);
  const matches =
    weightsComplete && expected !== null && Math.abs(total - expected) < 0.01;
  const missing = importFields
    .filter(
      (field) =>
        row[field.key] === "" ||
        row[field.key] === null ||
        row[field.key] === undefined,
    )
    .map((field) => field.label);
  const materials = new Map<string, number>();
  for (const component of components) {
    const name = component.material.trim() || "Polymer pending";
    materials.set(
      name,
      (materials.get(name) || 0) + (Number(component.weight) || 0),
    );
  }
  return {
    total,
    expected,
    matches,
    weightsComplete,
    missing,
    countMatches: components.length > 0 && components.length === row.components,
    materials: [...materials].map(([material, weight]) => ({
      material,
      weight,
      percentage: total ? (weight / total) * 100 : 0,
    })),
  };
}
