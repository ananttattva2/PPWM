import { db } from "@/lib/db";
import { apiError, checkOrigin } from "@/lib/access";
import { additionalPackagingSchema } from "@/lib/additional-packaging";
import { detailAccess } from "@/lib/additional-packaging-access";
import { ObjectId } from "mongodb";

type Context = { params: Promise<{ id: string; kind: string }> };
export async function GET(req: Request, { params }: Context) {
  try {
    const { id, kind } = await params;
    const rowNumber = Number(new URL(req.url).searchParams.get("rowNumber"));
    if (!(await detailAccess(id, kind, rowNumber)))
      return Response.json(
        { error: "Packaging row not found" },
        { status: 404 },
      );
    const saved = await db()
      .collection("packagingDetails")
      .findOne({ importId: id, kind, rowNumber });
    return Response.json(
      saved ? additionalPackagingSchema.parse(saved) : null,
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function PUT(req: Request, { params }: Context) {
  try {
    checkOrigin(req);
    const { id, kind } = await params;
    if (Number(req.headers.get("content-length")) > 100000)
      return Response.json({ error: "Details are too large" }, { status: 413 });
    const parsed = additionalPackagingSchema.safeParse(await req.json());
    if (!parsed.success || parsed.data.kind !== kind)
      return Response.json(
        { error: "Check the packaging fields and try again." },
        { status: 400 },
      );
    const { rowNumber } = parsed.data;
    const access = await detailAccess(id, kind, rowNumber, true);
    if (!access)
      return Response.json(
        { error: "Packaging row not found" },
        { status: 404 },
      );
    for (const [slot, file] of Object.entries(parsed.data.attachments)) {
      const existing = await db()
        .collection("packagingDetailFiles")
        .findOne(
          { _id: new ObjectId(file.id), importId: id, kind, rowNumber, slot },
          { projection: { name: 1, type: 1 } },
        );
      if (
        !existing ||
        existing.name !== file.name ||
        existing.type !== file.type
      )
        return Response.json(
          { error: "Invalid attachment. Upload the file again." },
          { status: 400 },
        );
    }
    const collection = db().collection("packagingDetails");
    await collection.createIndex(
      { importId: 1, kind: 1, rowNumber: 1 },
      { unique: true },
    );
    await collection.updateOne(
      { importId: id, kind, rowNumber },
      {
        $set: {
          ...parsed.data,
          updatedAt: new Date(),
          updatedBy: access.user.id,
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
    return Response.json(parsed.data);
  } catch (error) {
    return apiError(error);
  }
}
