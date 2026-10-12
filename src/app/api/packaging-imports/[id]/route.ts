import { ObjectId, Binary } from "mongodb";
import { db } from "@/lib/db";
import { requireUser, apiError } from "@/lib/access";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id))
      return Response.json({ error: "Import not found" }, { status: 404 });
    const record = await db()
      .collection("packagingImports")
      .findOne({ _id: new ObjectId(id) });
    if (!record)
      return Response.json({ error: "Import not found" }, { status: 404 });
    if (record.status === "draft" && record.createdBy !== user.id)
      throw new Error("FORBIDDEN");
    if (new URL(req.url).searchParams.get("download") === "true") {
      const bytes =
        record.file.data instanceof Binary
          ? record.file.data.buffer
          : record.file.data;
      return new Response(new Uint8Array(bytes), {
        headers: {
          "Content-Type":
            record.file.type === "CSV"
              ? "text/csv"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(record.file.name)}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const { data, ...file } = record.file;
    return Response.json({
      id: record._id.toString(),
      file,
      settings: record.settings,
      mapping: record.mapping,
      analysis: record.analysis,
      clientId: record.clientId,
      status: record.status,
    });
  } catch (e) {
    return apiError(e);
  }
}
