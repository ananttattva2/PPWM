import { importFields } from "./packaging-import-schema";
export const packagingTemplateFields = importFields.filter(
  (field) => field.key !== "material",
);
export function packagingTemplateCsv() {
  const examples: Record<string, string>[] = [
    {
      productName: "Mineral Water 500ml",
      sku: "SKU-001",
      category: "Beverages",
      packagingType: "Bottle",
      foodGrade: "Yes",
      supplierName: "Sample Supplier",
      supplierAddress: "Mumbai India",
      supplierContactNumber: "+91 9876543210",
      supplierEmail: "supplier@example.com",
      supplierAuthorisedPersonName: "Sample Contact",
      weight: "23.5",
      components: "3",
      labelCoverage: "80",
      adhesiveType: "Water-based",
      barrierLayer: "None",
      componentWeight: "20",
      printingInk: "Low coverage",
    },
    {
      productName: "Snack Pouch",
      sku: "SKU-002",
      category: "Snacks",
      packagingType: "Pouch",
      foodGrade: "Yes",
      supplierName: "Sample Supplier",
      supplierAddress: "Pune India",
      supplierContactNumber: "+91 9876543210",
      supplierEmail: "supplier@example.com",
      supplierAuthorisedPersonName: "Sample Contact",
      weight: "6.8",
      components: "4",
      labelCoverage: "60",
      adhesiveType: "Solvent-free",
      barrierLayer: "PE",
      componentWeight: "5",
      printingInk: "Standard",
    },
  ];
  const escape = (value: string) =>
    /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  return (
    [
      packagingTemplateFields.map((field) => field.label),
      ...examples.map((row) =>
        packagingTemplateFields.map((field) => row[field.key] || ""),
      ),
    ]
      .map((row) => row.map(escape).join(","))
      .join("\r\n") + "\r\n"
  );
}
