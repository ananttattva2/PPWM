import ExcelJS from "exceljs";
import {
  packagingTemplateFields,
  packagingTemplateRows,
} from "./packaging-import-template";
export function packagingTemplateWorkbook() {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Packaging Components", {
    views: [{ state: "frozen", ySplit: 1, xSplit: 2 }],
  });
  sheet.columns = packagingTemplateFields.map((field) => ({
    header: field.label,
    key: field.key,
    width:
      field.key === "supplierAddress"
        ? 32
        : field.key.includes("supplier")
          ? 29
          : 23,
  }));
  packagingTemplateRows().forEach((row) => sheet.addRow(row));
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: packagingTemplateFields.length },
  };
  sheet.getRow(1).height = 34;
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF007A87" },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
  const foodColumn =
    packagingTemplateFields.findIndex((field) => field.key === "foodGrade") + 1;
  const phoneColumn =
    packagingTemplateFields.findIndex(
      (field) => field.key === "supplierContactNumber",
    ) + 1;
  sheet.getColumn(phoneColumn).numFmt = "@";
  for (let row = 2; row <= 1001; row++)
    sheet.getCell(row, foodColumn).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Yes,No"'],
      showErrorMessage: true,
      errorTitle: "Choose Yes or No",
      error: "Food Grade must be Yes or No.",
    };
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    row.height = 30;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb:
            row.getCell("sku").value === "SKU-001" ? "FFF0FAF7" : "FFF4F7FD",
        },
      };
    });
  });
  const instructions = book.addWorksheet("Instructions");
  instructions.getColumn(1).width = 115;
  [
    "HOW TO FILL THIS TEMPLATE",
    "One row = one packaging component and supplier combination.",
    "Repeat the same SKU, product name, category, packaging type, total product packaging weight and component count on all rows for that SKU.",
    "Example: Mineral Water 500ml / SKU-001 has 3 components: Bottle, Cap and Label. Each has a different supplier.",
    "A component may appear on multiple rows when it has multiple suppliers. The same component and supplier combination should not be repeated within an SKU.",
    "Component weight (g) is the weight of this component. Total weight (g) is the product's full packaging weight; do not multiply it by the number of rows.",
    "Food Grade: select Yes or No for this component. Phone numbers are text so + prefixes and leading zeros remain intact.",
    "Supplier fields belong only to the component on that row. Leave optional fields blank when not known.",
    "Keep the header names. Replace or delete the sample rows before uploading. Upload the Packaging Components sheet first.",
    "Maximum 1,000 component rows per file and 30 components per SKU. Polymer is not required in this template.",
  ].forEach((text, index) => {
    const row = instructions.addRow([text]);
    row.height = index === 0 ? 30 : 45;
    row.alignment = { wrapText: true, vertical: "middle" };
    if (index === 0) row.font = { bold: true, size: 16 };
  });
  return book;
}
