import { requireUser, apiError } from "@/lib/access";
import { packagingTemplateWorkbook } from "@/lib/packaging-import-workbook";
export const runtime = "nodejs";
export async function GET() {
  try {
    await requireUser(["super_admin", "admin", "manager", "user"]);
    const bytes = await packagingTemplateWorkbook().xlsx.writeBuffer();
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          "attachment; filename=packaging-components-template.xlsx",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
