import { assertImportAccess } from "@/lib/client-access";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
import { classificationSchema } from "@/lib/packaging-classification";
import type { PackagingRow } from "@/lib/packaging-import-schema";
import { hydrateImportSuppliers } from "@/lib/hydrate-import-suppliers";
import { supplierOwnsComponent } from "@/lib/supplier-access";
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(req);
    const user = await requireUser([
      "super_admin",
      "admin",
      "manager",
      "user",
      "supplier",
    ]);
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id))
      return Response.json({ error: "Import not found" }, { status: 404 });
    const data = classificationSchema.parse(await req.json());
    const record = await db()
      .collection("packagingImports")
      .findOne({ _id: new ObjectId(id) });
    if (!record) throw new Error("FORBIDDEN");
    await assertImportAccess(user, record);
    const hydrated = hydrateImportSuppliers({
      headers: record.headers,
      mapping: record.mapping || {},
      rawRows: record.rawRows,
      settings: record.settings,
      analysis: record.analysis,
    });
    const row = (hydrated.analysis.rows as PackagingRow[]).find(
      (row) => row.rowNumber === data.rowNumber,
    );
    const component = row?.composition?.components.find(
      (component) => component.id === data.componentId,
    );
    if (!component)
      return Response.json({ error: "Component not found" }, { status: 404 });
    if (
      user.role === "supplier" &&
      (record.status !== "confirmed" ||
        !supplierOwnsComponent(user.email, component))
    )
      throw new Error("FORBIDDEN");
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
