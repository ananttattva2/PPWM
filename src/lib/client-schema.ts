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
export const packagingMaterials = [
  "Plastic",
  "Paper & board",
  "Metal",
  "Glass",
  "Other",
] as const;
export const companySchema = z.object({
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
  registrationNumber: z.string().trim().max(80),
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
  industry: z.string().trim().min(2).max(80),
  materials: z.array(z.enum(packagingMaterials)).default([]),
  notes: z.string().trim().max(2000),
});
export const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024;
export const MAX_DOCUMENTS = 5;
export const documentTypes = ["application/pdf", "image/png", "image/jpeg"];
