import { z } from "zod";
import type { PackagingComposition } from "./packaging-composition";
export const importCategories = [
  "Beverages",
  "Snacks",
  "Homecare",
  "Personal Care",
  "Food",
  "Electronics",
  "Healthcare",
  "Other",
] as const;
export const importFields = [
  { key: "sku", label: "SKU", required: true },
  { key: "productName", label: "Product name", required: true },
  { key: "category", label: "Category", required: true },
  { key: "packagingType", label: "Packaging type", required: true },
  { key: "material", label: "Material", required: true },
  { key: "weight", label: "Total weight (g)", required: true },
  { key: "components", label: "Components", required: true },
  { key: "labelCoverage", label: "Label coverage (%)", required: false },
  { key: "adhesiveType", label: "Adhesive type", required: false },
  { key: "barrierLayer", label: "Barrier layer details", required: false },
  { key: "componentWeight", label: "Component weight (g)", required: false },
  { key: "printingInk", label: "Printing / ink details", required: false },
] as const;
export type ImportField = (typeof importFields)[number]["key"];
export type ColumnMapping = Partial<Record<ImportField, string>>;
export const importSettingsSchema = z.object({
  category: z
    .enum(["All Categories", ...importCategories])
    .default("All Categories"),
  plant: z.string().trim().min(1).max(160).default("All Plants"),
  firstRow: z.enum(["headers", "data"]).default("headers"),
  updateExisting: z.boolean().default(true),
});
export type ImportSettings = z.infer<typeof importSettingsSchema>;
export const columnMappingSchema = z.partialRecord(
  z.enum(importFields.map((f) => f.key) as [ImportField, ...ImportField[]]),
  z.string().max(120),
);
export type ImportIssue = {
  row: number;
  sku: string;
  field: string;
  message: string;
  kind: "missing" | "error";
};
export type PackagingRow = {
  composition?: PackagingComposition;
  rowNumber: number;
  sku: string;
  productName: string;
  category: string;
  packagingType: string;
  material: string;
  weight: number | null;
  components: number | null;
  labelCoverage: string;
  adhesiveType: string;
  barrierLayer: string;
  componentWeight: number | null;
  printingInk: string;
  status: "complete" | "missing" | "error";
  issues: ImportIssue[];
};
export type ImportAnalysis = {
  rows: PackagingRow[];
  issues: ImportIssue[];
  summary: {
    total: number;
    complete: number;
    missing: number;
    errors: number;
    completeness: number;
  };
  missingFields: { field: string; count: number; impact: number }[];
  validationErrors: { field: string; message: string; count: number }[];
  materialFamilies: (
    "Plastic" | "Paper & board" | "Metal" | "Glass" | "Other"
  )[];
};
export type ImportResult = {
  id: string;
  file: {
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    uploadedBy: string;
  };
  headers: string[];
  mapping: ColumnMapping;
  settings: ImportSettings;
  analysis: ImportAnalysis;
  clientId?: string;
};
export const MAX_IMPORT_SIZE = 2 * 1024 * 1024;
