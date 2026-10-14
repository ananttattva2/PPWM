import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
import { classificationSchema } from "@/lib/packaging-classification";
import type { PackagingRow } from "@/lib/packaging-import-schema";
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(req);
    const user = await requireUser(["super_admin", "admin", "manager"]);
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id))
      return Response.json({ error: "Import not found" }, { status: 404 });
    const data = classificationSchema.parse(await req.json());
    const record = await db()
      .collection("packagingImports")
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { status: 1, createdBy: 1, "analysis.rows": 1 } },
      );
    if (!record || (record.status === "draft" && record.createdBy !== user.id))
      throw new Error("FORBIDDEN");
    const row = (record.analysis.rows as PackagingRow[]).find(
      (row) => row.rowNumber === data.rowNumber,
    );
    if (
      !row?.composition?.components.some(
        (component) => component.id === data.componentId,
      )
    )
      return Response.json({ error: "Component not found" }, { status: 404 });
    const collection = db().collection("packagingClassifications");
    await collection.createIndex(
      { importId: 1, rowNumber: 1, componentId: 1 },
      { unique: true },
    );
    const key = {
      importId: id,
      rowNumber: data.rowNumber,
      componentId: data.componentId,
    };
    await collection.updateOne(
      key,
      {
        $set: { ...data, updatedAt: new Date(), updatedBy: user.id },
        $setOnInsert: { importId: id, createdAt: new Date() },
      },
      { upsert: true },
    );
    return Response.json(data);
  } catch (error) {
    if (
      error instanceof Error &&
      !["UNAUTHORIZED", "FORBIDDEN"].includes(error.message)
    )
      console.error("Could not save component classification", error);
    return apiError(error);
  }
}
