import { mediaTypes } from "./media-types";
import { z } from "zod";

export const additionalKinds = [
  "ecommerce",
  "service",
  "reuse",
  "beverage",
  "composite",
] as const;
export const additionalKindSchema = z.enum(additionalKinds);
export type AdditionalKind = z.infer<typeof additionalKindSchema>;
export type DetailField = {
  key: string;
  label: string;
  type?: "number" | "month";
  options?: string[];
  unit?: string;
  whole?: boolean;
};
export const packagingDetails: Record<
  AdditionalKind,
  {
    tab: string;
    title: string;
    question: string;
    section: string;
    fields: DetailField[];
    extraTitle: string;
    extra: DetailField[];
    uploads: string[];
    note: string;
  }
> = {
  ecommerce: {
    tab: "E-commerce",
    title: "E-commerce packaging details",
    question: "Is packaging added for online delivery?",
    section: "Order configuration",
    fields: [
      {
        key: "orderType",
        label: "Order type",
        options: ["Single-product order", "Multi-product order"],
      },
      {
        key: "productsPerOrder",
        label: "Products / order",
        type: "number",
        whole: true,
      },
      { key: "orders", label: "Number of orders", type: "number", whole: true },
    ],
    extraTitle: "Space data & destination",
    extra: [
      { key: "length", label: "Internal length", type: "number", unit: "cm" },
      { key: "width", label: "Width", type: "number", unit: "cm" },
      { key: "height", label: "Height", type: "number", unit: "cm" },
      {
        key: "productVolume",
        label: "Packed-product volume",
        type: "number",
        unit: "cm³",
      },
      { key: "destination", label: "Destination market" },
    ],
    uploads: [],
    note: "Link existing product packaging; count added shipping components once.",
  },
  service: {
    tab: "Service Packaging",
    title: "Service packaging details",
    question: "Is packaging filled at the point of sale?",
    section: "Service details",
    fields: [
      {
        key: "outlet",
        label: "Outlet",
        options: [
          "Café counter",
          "Restaurant",
          "Retail counter",
          "Food truck",
          "Other",
        ],
      },
      {
        key: "use",
        label: "Use",
        options: ["Takeaway drink", "Takeaway meal", "Retail service", "Other"],
      },
      { key: "filledBy", label: "Filled by" },
      {
        key: "servings",
        label: "Number of servings",
        type: "number",
        whole: true,
      },
    ],
    extraTitle: "Supplier and evidence",
    extra: [{ key: "supplier", label: "Supplier" }],
    uploads: ["Material specification", "Packaging photo"],
    note: "Record cup coatings and other functional layers in the material specification.",
  },
  reuse: {
    tab: "Re-use / Refill",
    title: "Re-use / refill details",
    question: "Is there an organised reuse or refill system?",
    section: "System details",
    fields: [
      {
        key: "system",
        label: "System type",
        options: [
          "Return and refill",
          "Customer refill",
          "Pooled reuse",
          "Other",
        ],
      },
      { key: "operator", label: "Operator" },
      { key: "packagingId", label: "Packaging ID" },
      { key: "capacity", label: "Capacity", type: "number", unit: "ml" },
    ],
    extraTitle: "Tracking period & circulation records",
    extra: [
      { key: "period", label: "Tracking period", type: "month" },
      { key: "dispatches", label: "Dispatches", type: "number", whole: true },
      { key: "returns", label: "Returns", type: "number", whole: true },
      {
        key: "refills",
        label: "Washed and refilled",
        type: "number",
        whole: true,
      },
      { key: "retired", label: "Retired units", type: "number", whole: true },
    ],
    uploads: ["Return process", "Cleaning procedure", "Rotation log"],
    note: "Track stock, dispatches, returns and rotations separately. Stock mass is not dispatched mass.",
  },
  beverage: {
    tab: "Beverage / DRS",
    title: "Beverage container / potential DRS details",
    question: "Does this beverage container need a deposit-return assessment?",
    section: "Container details",
    fields: [
      {
        key: "beverage",
        label: "Beverage",
        options: [
          "Mineral water",
          "Soft drink",
          "Juice",
          "Milk",
          "Beer",
          "Wine",
          "Other",
        ],
      },
      {
        key: "containerMaterial",
        label: "Container material",
        options: ["PET", "Glass", "Aluminium", "Steel", "HDPE", "Other"],
      },
      { key: "capacity", label: "Capacity", type: "number", unit: "ml" },
      {
        key: "useType",
        label: "Use type",
        options: ["Single-use", "Reusable"],
      },
      { key: "destination", label: "Destination market" },
    ],
    extraTitle: "Scheme assessment",
    extra: [
      {
        key: "scheme",
        label: "Scheme applicability",
        options: ["Pending review", "Applicable", "Not applicable"],
      },
      { key: "schemeOperator", label: "Scheme operator" },
      { key: "deposit", label: "Deposit amount", type: "number" },
      {
        key: "currency",
        label: "Currency",
        options: ["EUR", "GBP", "DKK", "SEK", "NOK", "PLN", "Other"],
      },
      { key: "returnRoute", label: "Return route" },
    ],
    uploads: ["Required marking / scheme evidence"],
    note: "Determine the scheme scope for the destination market before confirming applicability.",
  },
  composite: {
    tab: "Composite / Multi-material",
    title: "Composite / multi-material details",
    question: "Does this packaging unit combine different materials?",
    section: "Unit details",
    fields: [
      { key: "capacity", label: "Capacity", type: "number", unit: "ml" },
      {
        key: "unitWeight",
        label: "Total unit weight",
        type: "number",
        unit: "g",
      },
    ],
    extraTitle: "Separability assessment",
    extra: [
      {
        key: "separable",
        label: "Can layers be separated by hand?",
        options: ["Yes", "No", "Unknown"],
      },
      {
        key: "attachment",
        label: "Attachment method",
        options: [
          "Laminated",
          "Adhesive",
          "Extruded",
          "Mechanical",
          "Other",
          "Unknown",
        ],
      },
      { key: "separateComponents", label: "Separate components" },
    ],
    uploads: ["Supplier specification", "Layer diagram / photo"],
    note: "Multiple materials alone do not establish legal composite classification. Retain the supporting assessment.",
  },
};
const attachment = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/),
  name: z.string().max(180),
  type: z.enum(mediaTypes),
});
export const additionalPackagingSchema = z
  .object({
    rowNumber: z.number().int().min(1).max(1001),
    kind: additionalKindSchema,
    used: z.enum(["yes", "no", "na"]),
    name: z.string().trim().max(160),
    fields: z.record(
      z.string().max(60),
      z.union([z.string().max(500), z.number().finite().min(0).max(1e12)]),
    ),
    components: z
      .array(
        z.object({
          id: z.string().regex(/^[\w-]{1,60}$/),
          name: z.string().trim().max(160),
          material: z.string().trim().max(160),
          quantity: z.number().int().min(0).max(1e9),
          weight: z.number().finite().min(0).max(1e9),
        }),
      )
      .max(50),
    attachments: z
      .record(z.string().max(60), attachment)
      .refine((files) => Object.keys(files).length <= 6),
  })
  .superRefine((data, ctx) => {
    const config = packagingDetails[data.kind];
    const definitions = [...config.fields, ...config.extra];
    for (const [key, value] of Object.entries(data.fields)) {
      const field = definitions.find((item) => item.key === key);
      if (
        !field ||
        (field.type === "number"
          ? typeof value !== "number" ||
            (field.whole && !Number.isInteger(value))
          : typeof value !== "string")
      )
        ctx.addIssue({
          code: "custom",
          message: "Invalid field value",
          path: ["fields", key],
        });
      if (
        field?.options &&
        value !== "" &&
        !field.options.includes(String(value))
      )
        ctx.addIssue({
          code: "custom",
          message: "Invalid option",
          path: ["fields", key],
        });
      if (
        field?.type === "month" &&
        value !== "" &&
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(String(value))
      )
        ctx.addIssue({
          code: "custom",
          message: "Invalid tracking month",
          path: ["fields", key],
        });
    }
    if (
      Object.keys(data.attachments).some(
        (key) => !["photo", ...config.uploads].includes(key),
      )
    )
      ctx.addIssue({ code: "custom", message: "Invalid attachment slot" });
  });
export type AdditionalPackagingData = z.infer<typeof additionalPackagingSchema>;
export function detailSummary(data: AdditionalPackagingData) {
  const active = data.used === "yes";
  const weight = active
    ? data.components.reduce(
        (sum, item) => sum + item.quantity * item.weight,
        0,
      )
    : 0;
  const materialWeight = active
    ? data.components.reduce((sum, item) => sum + item.weight, 0)
    : 0;
  const multiplier = Number(
    data.fields[data.kind === "ecommerce" ? "orders" : "servings"] || 0,
  );
  const main = active
    ? [...data.components].sort((a, b) => b.weight - a.weight)[0]?.material ||
      "Not specified"
    : "Not applicable";
  return {
    weight,
    totalKg: (weight * multiplier) / 1000,
    materialWeight,
    main,
    volume:
      Number(data.fields.length || 0) *
      Number(data.fields.width || 0) *
      Number(data.fields.height || 0),
  };
}
