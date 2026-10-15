import { z } from "zod";
import {
  importFields,
  type PackagingRow,
  type ImportField,
} from "./packaging-import-schema";

const text = z.string().trim().max(200);
export const compositionComponentSchema = z.object({
  id: z
    .string()
    .regex(/^[a-zA-Z0-9-]{1,60}$/)
    .refine((value) => value !== "product"),
  name: text,
  foodGrade: text
    .refine(
      (value) => ["", "Yes", "No"].includes(value),
      "Food grade must be Yes or No",
    )
    .optional(),
  supplierName: text.optional(),
  supplierAddress: text.optional(),
  supplierContactNumber: text
    .refine(
      (value) =>
        !value ||
        (/^[+()\d .-]{5,30}$/.test(value) &&
          value.replace(/\D/g, "").length >= 5),
      "Enter a valid supplier contact number",
    )
    .optional(),
  supplierEmail: text
    .refine(
      (value) => !value || z.email().safeParse(value).success,
      "Enter a valid supplier email address",
    )
    .optional(),
  supplierAuthorisedPersonName: text.optional(),
  material: text,
  colour: text,
  weight: z
    .string()
    .regex(/^(?:\d+(?:\.\d+)?)?$/)
    .max(20),
  labelCoverage: text,
  adhesiveType: text,
  barrierLayer: text,
  printingInk: text,
  image: z
    .string()
    .regex(/^[a-f0-9]{24}$/)
    .or(z.literal("")),
});
export const compositionSchema = z.object({
  components: z
    .array(compositionComponentSchema)
    .max(30)
    .refine(
      (items) => new Set(items.map((item) => item.id)).size === items.length,
      "Component IDs must be unique",
    ),
  productImage: z
    .string()
    .regex(/^[a-f0-9]{24}$/)
    .or(z.literal("")),
  productImages: z
    .array(z.string().regex(/^[a-f0-9]{24}$/))
    .max(12)
    .default([]),
  brand: text,
  netContent: text,
});
export type PackagingComposition = z.infer<typeof compositionSchema>;
export type CompositionComponent = z.infer<typeof compositionComponentSchema>;
export const compositionUpdateSchema = z.object({
  rowNumber: z.number().int().min(1).max(1001),
  fields: z.record(
    z.enum(
      importFields.map((field) => field.key) as [ImportField, ...ImportField[]],
    ),
    text,
  ),
  composition: compositionSchema,
});
export function rowFields(row: PackagingRow): Record<ImportField, string> {
  return Object.fromEntries(
    importFields.map(({ key }) => [key, String(row[key] ?? "")]),
  ) as Record<ImportField, string>;
}
export function initialComposition(row: PackagingRow): PackagingComposition {
  return (
    (row.composition
      ? {
          ...row.composition,
          productImages: row.composition.productImages || [],
        }
      : null) || {
      brand: "",
      netContent: "",
      productImage: "",
      productImages: [],
      components: [
        {
          id: "main",
          name: "Main packaging",
          material: row.material,
          colour: "",
          weight: String(row.componentWeight ?? ""),
          labelCoverage: row.labelCoverage,
          adhesiveType: row.adhesiveType,
          barrierLayer: row.barrierLayer,
          printingInk: row.printingInk,
          image: "",
        },
      ],
    }
  );
}
