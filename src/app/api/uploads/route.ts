import { assertPackagingScope } from "@/lib/packaging-scopes";
import { ObjectId } from "mongodb";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { assertImportAccess } from "@/lib/client-access";
import { hydrateImportSuppliers } from "@/lib/hydrate-import-suppliers";
import { supplierOwnsComponent } from "@/lib/supplier-access";
import type { PackagingRow } from "@/lib/packaging-import-schema";
import { mediaTypes, validMediaSignature } from "@/lib/media-types";
import { readMedia, storeMedia } from "@/lib/cloudinary-storage";

export const runtime = "nodejs";
async function authorize(
  importId: string,
  rowNumber: number,
  componentId: string,
  write: boolean,
) {
  const user = await requireUser(
    write
      ? ["super_admin", "admin", "manager", "user", "supplier"]
      : ["super_admin", "admin", "manager", "user", "compliance", "supplier"],
  );
  assertPackagingScope(user, "sales");
  if (!/^[a-f0-9]{24}$/i.test(importId) || !Number.isInteger(rowNumber))
    throw new Error("FORBIDDEN");
  const record = await db()
    .collection("packagingImports")
    .findOne({ _id: new ObjectId(importId) });
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
    (item) => item.rowNumber === rowNumber,
  );
  const component = row?.composition?.components.find(
    (item) => item.id === componentId,
  );
  if (
    !row ||
    (componentId && !component) ||
    (user.role === "supplier" &&
      (!component ||
        record.status !== "confirmed" ||
        !supplierOwnsComponent(user.email, component)))
  )
    throw new Error("FORBIDDEN");
  return user;
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    await requireUser(["super_admin", "admin", "manager", "user", "supplier"]);
    if (Number(req.headers.get("content-length")) > 51 * 1024 * 1024)
      return Response.json(
        { error: "Upload files up to 50 MB." },
        { status: 413 },
      );
    const form = await req.formData();
    const importId = String(form.get("importId") || ""),
      rowNumber = Number(form.get("rowNumber")),
      componentId = String(form.get("componentId") || ""),
      slot = String(form.get("slot") || "evidence").slice(0, 160);
    const user = await authorize(importId, rowNumber, componentId, true);
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > 50 * 1024 * 1024 ||
      !(mediaTypes as readonly string[]).includes(file.type)
    )
      return Response.json(
        {
          error:
            "Choose a supported image, video, PDF, spreadsheet or document up to 50 MB.",
        },
        { status: 400 },
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!validMediaSignature(file.type, bytes))
      return Response.json(
        { error: "File contents do not match the declared type." },
        { status: 400 },
      );
    const value = {
      importId,
      rowNumber,
      componentId,
      slot,
      name: file.name.slice(0, 180),
      type: file.type,
      size: file.size,
      ...(await storeMedia(bytes, file.name, file.type)),
      createdAt: new Date(),
      createdBy: user.id,
    };
    const result = await db().collection("mediaUploads").insertOne(value);
    return Response.json({
      id: result.insertedId.toString(),
      name: value.name,
      type: value.type,
      size: value.size,
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function GET(req: Request) {
  try {
    await requireUser([
      "super_admin",
      "admin",
      "manager",
      "user",
      "compliance",
      "supplier",
    ]);
    const query = new URL(req.url).searchParams;
    const id = query.get("id");
    if (id) {
      if (!/^[a-f0-9]{24}$/i.test(id))
        return new Response(null, { status: 404 });
      const file = await db()
        .collection("mediaUploads")
        .findOne({ _id: new ObjectId(id) });
      if (!file) return new Response(null, { status: 404 });
      await authorize(file.importId, file.rowNumber, file.componentId, false);
      return new Response(await readMedia(file), {
        headers: {
          "Content-Type": file.type,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        },
      });
    }
    const importId = query.get("importId") || "",
      rowNumber = Number(query.get("rowNumber")),
      componentId = query.get("componentId") || "",
      slot = query.get("slot") || "";
    await authorize(importId, rowNumber, componentId, false);
    const files = await db()
      .collection("mediaUploads")
      .find(
        { importId, rowNumber, componentId, ...(slot ? { slot } : {}) },
        { projection: { _id: 1, name: 1, type: 1, size: 1 } },
      )
      .sort({ _id: -1 })
      .limit(100)
      .toArray();
    return Response.json(
      files.map((file) => ({
        id: file._id.toString(),
        name: file.name,
        type: file.type,
        size: file.size,
      })),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
