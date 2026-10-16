import { Binary, ObjectId } from "mongodb";
import { ZodError } from "zod";
import { db, getClient } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
import { clientOwnerFilter, clientEditorRoles } from "@/lib/client-permissions";
import { assertClientAccess } from "@/lib/client-access";
import {
  clientSchema,
  MAX_DOCUMENT_SIZE,
  MAX_DOCUMENTS,
  documentTypes,
} from "@/lib/client-schema";
export const runtime = "nodejs";
export async function GET() {
  try {
    const user = await requireUser();
    return Response.json(
      await db()
        .collection("clients")
        .find(clientOwnerFilter(user))
        .project({ "documents.data": 0 })
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray(),
    );
  } catch (e) {
    return apiError(e);
  }
}
function validSignature(bytes: Buffer, type: string) {
  if (type === "application/pdf")
    return bytes.subarray(0, 5).toString() === "%PDF-";
  if (type === "image/png")
    return bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await requireUser(clientEditorRoles);
    if (Number(req.headers.get("content-length")) > 12 * 1024 * 1024)
      return Response.json(
        {
          error:
            "The upload is too large. Upload up to 5 documents, 2 MB each.",
        },
        { status: 413 },
      );
    const multipart = await req.formData();
    const raw = multipart.get("data");
    if (typeof raw !== "string")
      return Response.json(
        { error: "Client information is missing." },
        { status: 400 },
      );
    const { clientId: targetId, ...data } = clientSchema.parse(JSON.parse(raw));
    const database = db();
    const existing = targetId
      ? await database
          .collection("clients")
          .findOne({ _id: new ObjectId(targetId) })
      : null;
    if (targetId && !existing)
      return Response.json({ error: "Client not found" }, { status: 404 });
    if (existing) assertClientAccess(user, existing);
    if (existing?.packagingImport)
      return Response.json(
        {
          error:
            "This client already has packaging. Reopen it to manage the saved import.",
        },
        { status: 409 },
      );
    const files = multipart.getAll("documents");
    if (
      (!files.length && !existing?.documents?.length) ||
      files.length + (existing?.documents?.length || 0) > MAX_DOCUMENTS
    )
      return Response.json(
        { error: "Upload between 1 and 5 supporting documents." },
        { status: 400 },
      );
    const documents: {
      name: string;
      type: string;
      size: number;
      data: Binary;
      uploadedAt: Date;
      uploadedBy: string;
    }[] = [];
    for (const file of files) {
      if (
        !(file instanceof File) ||
        file.size === 0 ||
        file.size > MAX_DOCUMENT_SIZE ||
        !documentTypes.includes(file.type)
      )
        return Response.json(
          {
            error: "Documents must be PDF, PNG or JPEG files, up to 2 MB each.",
          },
          { status: 400 },
        );
      const bytes = Buffer.from(await file.arrayBuffer());
      if (!validSignature(bytes, file.type))
        return Response.json(
          { error: "A document does not match its declared file type." },
          { status: 400 },
        );
      documents.push({
        name: file.name.replace(/[\r\n/\\]/g, "_").slice(0, 180),
        type: file.type,
        size: file.size,
        data: new Binary(bytes),
        uploadedAt: new Date(),
        uploadedBy: user.id,
      });
    }
    const clientId = existing?._id || new ObjectId();
    const profile = {
      ...data,
      company: data.legalName,
      contact: data.authorisedPerson,
      documents: [...(existing?.documents || []), ...documents],
      schemaVersion: 3,
      updatedAt: new Date(),
    };
    if (!data.packagingImportId) {
      if (existing)
        throw new Error(
          "Use the client edit action to update organisation details.",
        );
      await database.collection("clients").insertOne({
        _id: clientId,
        ...profile,
        status: "packaging_pending",
        createdBy: user.id,
        createdAt: new Date(),
      });
      return Response.json(
        {
          id: clientId,
          message: "Organisation saved. Packaging can be added later.",
        },
        { status: 201 },
      );
    }
    const importId = new ObjectId(data.packagingImportId);
    await database.collection("packagingSkus").createIndex(
      { clientId: 1, sku: 1 },
      {
        unique: true,
        name: "client_sku_present_unique",
        partialFilterExpression: { sku: { $type: "string", $gt: "" } },
      },
    );
    // Keep real SKUs unique while allowing several incomplete rows without SKUs.
    const skuIndexes = await database
      .collection("packagingSkus")
      .listIndexes()
      .toArray();
    for (const index of skuIndexes) {
      if (
        index.unique &&
        !index.partialFilterExpression &&
        index.key.clientId === 1 &&
        index.key.sku === 1 &&
        Object.keys(index.key).length === 2 &&
        index.name
      )
        await database.collection("packagingSkus").dropIndex(index.name);
    }
    await getClient().withSession(async (session) =>
      session.withTransaction(async () => {
        const imported = await database
          .collection("packagingImports")
          .findOne(
            { _id: importId, createdBy: user.id, status: "draft" },
            { session },
          );
        if (
          !imported ||
          (imported.draftClientId &&
            imported.draftClientId !== clientId.toString())
        )
          throw new Error("FORBIDDEN");
        if (
          !imported.analysis.summary.total ||
          imported.analysis.summary.errors
        )
          throw new Error("Import contains unresolved issues");
        const linkedProfile = {
          ...profile,
          materials: imported.analysis.materialFamilies,
          packagingImport: {
            id: importId,
            fileName: imported.file.name,
            settings: imported.settings,
            summary: imported.analysis.summary,
          },
          status: "onboarding",
        };
        if (existing) {
          const updated = await database.collection("clients").updateOne(
            {
              _id: clientId,
              updatedAt: existing.updatedAt,
              packagingImport: { $exists: false },
            },
            { $set: linkedProfile, $unset: { packagingDraftId: "" } },
            { session },
          );
          if (!updated.matchedCount)
            throw new Error(
              "Client changed while saving. Reopen it and try again.",
            );
        } else {
          await database.collection("clients").insertOne(
            {
              _id: clientId,
              ...linkedProfile,
              createdBy: user.id,
              createdAt: new Date(),
            },
            { session },
          );
        }
        const skuRecords = imported.analysis.rows.map(
          (row: Record<string, unknown>) => ({
            ...row,
            clientId: clientId.toString(),
            importId: importId.toString(),
            plant: imported.settings.plant,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        );
        if (imported.settings.updateExisting) {
          await database.collection("packagingSkus").bulkWrite(
            skuRecords.map((row: Record<string, unknown>) => ({
              updateOne: {
                filter: row.sku
                  ? { clientId: row.clientId, sku: row.sku }
                  : {
                      clientId: row.clientId,
                      importId: row.importId,
                      rowNumber: row.rowNumber,
                    },
                update: { $set: row },
                upsert: true,
              },
            })),
            { session },
          );
        } else
          await database
            .collection("packagingSkus")
            .insertMany(skuRecords, { session });
        const claimed = await database.collection("packagingImports").updateOne(
          { _id: importId, createdBy: user.id, status: "draft" },
          {
            $set: {
              status: "confirmed",
              clientId: clientId.toString(),
              confirmedAt: new Date(),
            },
            $unset: { expiresAt: "" },
          },
          { session },
        );
        if (!claimed.matchedCount) throw new Error("FORBIDDEN");
        await database
          .collection("packagingAssets")
          .updateMany(
            { importId: importId.toString() },
            { $unset: { expiresAt: "" } },
            { session },
          );
      }),
    );
    return Response.json(
      { id: clientId, message: "Client created successfully." },
      { status: existing ? 200 : 201 },
    );
  } catch (e) {
    if (e instanceof ZodError)
      return Response.json(
        {
          error: "Please correct the highlighted client information.",
          fields: e.flatten().fieldErrors,
        },
        { status: 400 },
      );
    return apiError(e);
  }
}
