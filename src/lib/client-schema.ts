import { mediaTypes } from "./media-types";
import { z } from "zod";
export const organisationRoles = [
  "Producer",
  "Manufacturer",
  "Supplier",
  "Importer",
  "Distributor",
  "Final Distributor",
  "Fulfilment Service Provider",
  "Authorised Representative",
] as const;
export const operatorStatuses = [
  "Packaging manufacturer",
  "Legal manufacturer",
  "Private label / distributor's own brand",
  "Operator responsible for compliance",
  "PPWR importer",
  "EPR producer / first operator making available",
  "Distance seller",
  "Operator requiring an Authorised Representative",
  "Distributor",
  "Online marketplace / platform",
  "Relevant logistics operator",
  "End user",
] as const;
export const obligationsByRole = [
  "Manufacturer / Legal manufacturer",
  "Private label / distributor's own brand",
  "Importer",
  "Distributor",
  "EPR producer",
  "Distance seller / Marketplace / Logistics operator",
  "Re-use / Refill / DRS operator",
] as const;
export const packagingMaterials = [
  "Plastic",
  "Paper & board",
  "Metal",
  "Glass",
  "Other",
] as const;
export const restrictedPackagingFormats = [
  {
    id: "bundle-products",
    title: "Plastic packaging used to bundle products",
    description:
      "Plastic wrapping used to bundle several products together to encourage customers to buy them as a group.",
    example: "Example: plastic wrapping around a pack of 6 water bottles.",
  },
  {
    id: "fresh-produce",
    title: "Plastic packaging for fresh fruits and vegetables",
    description:
      "Plastic bags, nets or trays used to pack fresh fruit and vegetables in packs weighing less than 1.5 kg.",
    example: "Example: a small plastic pack of apples or tomatoes.",
  },
  {
    id: "food-service",
    title: "Single-use plastic packaging for food and drinks in restaurants",
    description:
      "Disposable plastic packaging used for food or drinks consumed at a restaurant or café.",
    example: "Example: disposable plastic plates, cups and food trays.",
  },
  {
    id: "condiment-sachets",
    title: "Small plastic packs of sauces, sugar and condiments",
    description:
      "Individual plastic sachets or containers provided with meals in restaurants and cafés.",
    example: "Example: ketchup sachets, sugar packets and small creamer tubs.",
  },
  {
    id: "hotel-toiletries",
    title: "Single-use toiletry packaging in hotels",
    description:
      "Small toiletries provided for one guest's stay and discarded before the next guest arrives.",
    example: "Example: mini shampoo bottles and small body-lotion bottles.",
  },
  {
    id: "thin-shopping-bags",
    title: "Very thin plastic shopping bags",
    description:
      "Extremely thin plastic bags, except when needed for hygiene or to prevent food waste.",
    example: "Example: very thin bags used for loose fruits and vegetables.",
  },
] as const;
export const companySchema = z.object({
  operatorStatus: z
    .array(z.enum(operatorStatuses))
    .max(operatorStatuses.length)
    .default([]),
  obligationsByRole: z
    .array(z.enum(obligationsByRole))
    .max(obligationsByRole.length)
    .default([]),
  legalName: z.string().trim().min(2, "Enter the legal name.").max(160),
  tradeName: z.string().trim().min(2, "Enter the trade name.").max(160),
  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
      "Enter a valid 15-character GST number.",
    ),
  registrationNumber: z.string().trim().max(80).default(""),
  organisationRole: z.enum(organisationRoles, {
    error: "Select an organisation role.",
  }),
  registeredAddress: z
    .string()
    .trim()
    .min(10, "Enter the complete registered address.")
    .max(1000),
  email: z.email("Enter a valid email address.").toLowerCase(),
  telephone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,24}$/, "Enter a valid telephone number.")
    .refine(
      (v) => v.replace(/\D/g, "").length >= 7,
      "Enter a valid telephone number.",
    ),
  authorisedPerson: z
    .string()
    .trim()
    .min(2, "Enter the authorised person’s name.")
    .max(160),
  country: z.string().trim().min(2).max(80),
});
export const clientSchema = companySchema.extend({
  packagingImportId: z
    .string()
    .regex(/^[a-f0-9]{24}$/i, "Choose a valid packaging import.")
    .optional(),
  clientId: z
    .string()
    .regex(/^[a-f0-9]{24}$/i)
    .optional(),
  industry: z.string().trim().max(80).default(""),
  materials: z.array(z.enum(packagingMaterials)).default([]),
  notes: z.string().trim().max(2000).default(""),
});
export const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024;
export const MAX_DOCUMENTS = 5;
export const documentTypes: readonly string[] = mediaTypes;
