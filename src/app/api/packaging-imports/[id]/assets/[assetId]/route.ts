import { ObjectId, Binary } from "mongodb";
import { db } from "@/lib/db";
import { requireUser, apiError } from "@/lib/access";
import { hydrateImportSuppliers } from "@/lib/hydrate-import-suppliers";
import { supplierCanReadAsset } from "@/lib/supplier-access";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> },
) {
  try {
    const user = await requireUser([
      "super_admin",
      "admin",
      "manager",
      "compliance",
      "user",
      "supplier",
    ]);
    const { id, assetId } = await params;
    if (![id, assetId].every((value) => /^[a-f0-9]{24}$/i.test(value)))
      return new Response(null, { status: 404 });
    const record = await db()
      .collection("packagingImports")
      .findOne({ _id: new ObjectId(id) });
    if (!record || (record.status === "draft" && record.createdBy !== user.id))
      throw new Error("FORBIDDEN");
    if (user.role === "supplier") {
      const hydrated = hydrateImportSuppliers({
        headers: record.headers,
        mapping: record.mapping || {},
        rawRows: record.rawRows,
        settings: record.settings,
        analysis: record.analysis,
      });
      if (
        record.status !== "confirmed" ||
        !supplierCanReadAsset(hydrated.analysis.rows, user.email, assetId)
      )
        throw new Error("FORBIDDEN");
    }
    const asset = await db()
      .collection("packagingAssets")
      .findOne({ _id: new ObjectId(assetId), importId: id });
    if (!asset) return new Response(null, { status: 404 });
    return new Response(
      new Uint8Array(
        asset.data instanceof Binary ? asset.data.buffer : asset.data,
      ),
      {
        headers: {
          "Content-Type": asset.type,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    return apiError(error);
  }
}
