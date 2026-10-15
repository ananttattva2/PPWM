import { z } from "zod";
import type { PackagingRow } from "./packaging-import-schema";
export const MAX_GROUP_COUNT = 100000;
const componentCountSchema = z.object({
  componentId: z.string().regex(/^[a-zA-Z0-9-]{1,60}$/),
  count: z.number().int().min(0).max(MAX_GROUP_COUNT),
});
export const groupPackagingSchema = z.object({
  groups: z
    .array(
      z.object({
        rowNumber: z.number().int().min(1).max(1001),
        components: z
          .array(componentCountSchema)
          .max(30)
          .refine(
            (items) =>
              new Set(items.map((item) => item.componentId)).size ===
              items.length,
            "Component counts must be unique",
          ),
      }),
    )
    .max(1000)
    .refine(
      (groups) =>
        new Set(groups.map((group) => group.rowNumber)).size === groups.length,
      "SKU rows must be unique",
    ),
});
export type GroupPackagingData = z.infer<typeof groupPackagingSchema>;
export type GroupCounts = Record<string, string>;
export function groupCountKey(rowNumber: number, componentId: string) {
  return `${rowNumber}:${componentId}`;
}
export function groupCountsPayload(
  rows: PackagingRow[],
  counts: GroupCounts,
): GroupPackagingData {
  return {
    groups: rows
      .map((row) => ({
        rowNumber: row.rowNumber,
        components: (row.composition?.components || []).flatMap((component) => {
          const value = counts[groupCountKey(row.rowNumber, component.id)];
          return value === undefined || value.trim() === ""
            ? []
            : [{ componentId: component.id, count: Number(value) }];
        }),
      }))
      .filter((group) => group.components.length > 0),
  };
}
export function groupReferencesExist(
  data: GroupPackagingData,
  rows: PackagingRow[],
) {
  const source = new Map(
    rows.map((row) => [
      row.rowNumber,
      new Set(
        row.composition?.components.map((component) => component.id) || [],
      ),
    ]),
  );
  return data.groups.every(
    (group) =>
      source.has(group.rowNumber) &&
      group.components.every((component) =>
        source.get(group.rowNumber)!.has(component.componentId),
      ),
  );
}
export function groupTotals(row: PackagingRow, counts: GroupCounts) {
  let count = 0,
    weight = 0,
    weightComplete = true;
  for (const component of row.composition?.components || []) {
    const quantity = Number(
      counts[groupCountKey(row.rowNumber, component.id)] || 0,
    );
    if (
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      quantity > MAX_GROUP_COUNT
    )
      continue;
    count += quantity;
    if (quantity > 0 && component.weight.trim() === "") weightComplete = false;
    else weight += (Number(component.weight) || 0) * quantity;
  }
  return { count, weight, weightComplete };
}
