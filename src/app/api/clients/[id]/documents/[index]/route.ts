import { ObjectId, Binary } from "mongodb";
import { db } from "@/lib/db";
import { apiError, requireUser } from "@/lib/access";
import { assertClientAccess } from "@/lib/client-access";
export const runtime = "nodejs";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; index: string }> },
) {
  try {
    const user = await requireUser();
    const { id, index } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id) || !/^\d$/.test(index))
      return Response.json({ error: "Document not found" }, { status: 404 });
    const client = await db()
      .collection("clients")
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { documents: 1, createdBy: 1 } },
      );
    if (client) assertClientAccess(user, client);
    const document = client?.documents?.[Number(index)];
    if (!document)
      return Response.json({ error: "Document not found" }, { status: 404 });
    const bytes =
      document.data instanceof Binary ? document.data.buffer : document.data;
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": document.type,
        "Content-Disposition": `attachment; filename="document"; filename*=UTF-8''${encodeURIComponent(document.name)}`,
        "Content-Length": String(document.size),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
