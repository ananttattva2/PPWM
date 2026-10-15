import { importFields } from "./packaging-import-schema";
export const packagingTemplateFields = importFields.filter(
  (field) => field.key !== "material",
);
export function packagingTemplateRows(): Record<string, string>[] {
  const products = [
    {
      productName: "Mineral Water 500ml",
      sku: "SKU-001",
      category: "Beverages",
      packagingType: "Bottle",
      weight: "23.5",
      components: "3",
      parts: [
        [
          "Bottle",
          "20",
          "Bottle Supplier",
          "Mumbai India",
          "bottles@example.com",
          "Bottle Contact",
        ],
        [
          "Cap",
          "2.5",
          "Cap Supplier",
          "Pune India",
          "caps@example.com",
          "Cap Contact",
        ],
        [
          "Label",
          "1",
          "Label Supplier",
          "Ahmedabad India",
          "labels@example.com",
          "Label Contact",
        ],
      ],
    },
    {
      productName: "Snack Pouch",
      sku: "SKU-002",
      category: "Snacks",
      packagingType: "Pouch",
      weight: "6.8",
      components: "4",
      parts: [
        [
          "Pouch",
          "5",
          "Pouch Supplier",
          "Delhi India",
          "pouches@example.com",
          "Pouch Contact",
        ],
        [
          "Zip Closure",
          "0.8",
          "Closure Supplier",
          "Pune India",
          "closures@example.com",
          "Closure Contact",
        ],
        [
          "Label",
          "0.5",
          "Label Supplier",
          "Ahmedabad India",
          "labels@example.com",
          "Label Contact",
        ],
        [
          "Seal",
          "0.5",
          "Seal Supplier",
          "Mumbai India",
          "seals@example.com",
          "Seal Contact",
        ],
      ],
    },
  ];
  return products.flatMap((product) =>
    product.parts.map(
      ([
        componentName,
        componentWeight,
        supplierName,
        supplierAddress,
        supplierEmail,
        supplierAuthorisedPersonName,
      ]) => ({
        productName: product.productName,
        sku: product.sku,
        category: product.category,
        packagingType: product.packagingType,
        weight: product.weight,
        components: product.components,
        componentName,
        componentWeight,
        foodGrade: componentName === "Label" ? "No" : "Yes",
        supplierName,
        supplierAddress,
        supplierEmail,
        supplierAuthorisedPersonName,
        supplierContactNumber: "+91 9876543210",
        labelCoverage: "",
        adhesiveType: "",
        barrierLayer: "",
        printingInk: "",
      }),
    ),
  );
}
export function packagingTemplateCsv() {
  const escape = (value: string) =>
    /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  return (
    [
      packagingTemplateFields.map((field) => field.label),
      ...packagingTemplateRows().map((row) =>
        packagingTemplateFields.map((field) => row[field.key] || ""),
      ),
    ]
      .map((row) => row.map(escape).join(","))
      .join("\r\n") + "\r\n"
  );
}
