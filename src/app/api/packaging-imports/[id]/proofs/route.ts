import { Binary, ObjectId } from "mongodb";
import { db, getClient } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
import { sustainabilityRequirements } from "@/lib/sustainability-checklist";
import {
  PROOF_MAX_SIZE,
  PROOF_BATCH_LIMIT,
  validProofSignature,
} from "@/lib/sustainability-proof";
import type { PackagingRow } from "@/lib/packaging-import-schema";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
async function scope(req: Request, context: Context, write = false) {
  if (write) checkOrigin(req);
  const user = await requireUser(
    write ? ["super_admin", "admin", "manager"] : undefined,
  );
  const { id } = await context.params;
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new Error("FORBIDDEN");
  const query = new URL(req.url).searchParams;
  const rowNumber = Number(query.get("rowNumber"));
  const componentId = query.get("componentId") || "";
  const record = await db()
    .collection("packagingImports")
    .findOne({ _id: new ObjectId(id) });
  if (!record || (record.status === "draft" && record.createdBy !== user.id))
    throw new Error("FORBIDDEN");
  const row = (record.analysis.rows as PackagingRow[]).find(
    (row) => row.rowNumber === rowNumber,
  );
  if (
    !row?.composition?.components.some(
      (component) => component.id === componentId,
    )
  )
    throw new Error("FORBIDDEN");
  return { key: { importId: id, rowNumber, componentId }, record, user };
}
export async function GET(req: Request, context: Context) {
  try {
    const { key } = await scope(req, context);
    const fileId = new URL(req.url).searchParams.get("file");
    const collection = db().collection("sustainabilityProofs");
    if (fileId) {
      if (!/^[a-f0-9]{24}$/i.test(fileId))
        return new Response(null, { status: 404 });
      const proof = await collection.findOne({
        ...key,
        _id: new ObjectId(fileId),
      });
      if (!proof) return new Response(null, { status: 404 });
      return new Response(new Uint8Array((proof.data as Binary).buffer), {
        headers: {
          "Content-Type": proof.type,
          "Content-Disposition": `${new URL(req.url).searchParams.get("preview") === "1" ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(proof.name)}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const proofs = await collection
      .find(key, { projection: { data: 0 } })
      .sort({ createdAt: 1 })
      .toArray();
    return Response.json(
      {
        proofs: proofs.map((proof) => ({
          id: proof._id.toString(),
          requirementId: proof.requirementId,
          name: proof.name,
          type: proof.type,
          size: proof.size,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(req: Request, context: Context) {
  try {
    const { key, record, user } = await scope(req, context, true);
    if (
      Number(req.headers.get("content-length")) >
      PROOF_MAX_SIZE * PROOF_BATCH_LIMIT + 1024 * 1024
    )
      return Response.json(
        { error: "Upload up to 6 files, 10 MB each." },
        { status: 400 },
      );
    const form = await req.formData();
    const requirementId = String(form.get("requirementId") || "");
    const files = form.getAll("files");
    if (
      !sustainabilityRequirements.some((item) => item.id === requirementId) ||
      !files.length ||
      files.length > PROOF_BATCH_LIMIT
    )
      return Response.json(
        { error: "Choose a checklist item and 1–6 files." },
        { status: 400 },
      );
    const uploads: {
      _id: ObjectId;
      importId: string;
      rowNumber: number;
      componentId: string;
      requirementId: string;
      name: string;
      type: string;
      size: number;
      data: Binary;
      createdBy: string;
      createdAt: Date;
      expiresAt?: Date;
    }[] = [];
    for (const file of files) {
      if (!(file instanceof File) || !file.size || file.size > PROOF_MAX_SIZE)
        return Response.json(
          { error: "Each proof must be a non-empty image or PDF up to 10 MB." },
          { status: 400 },
        );
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!validProofSignature(file.type, bytes))
        return Response.json(
          { error: "Use valid PNG, JPEG, WebP images or PDF documents." },
          { status: 400 },
        );
      uploads.push({
        _id: new ObjectId(),
        ...key,
        requirementId,
        name: file.name.slice(0, 180),
        type: file.type,
        size: file.size,
        data: new Binary(bytes),
        createdBy: user.id,
        createdAt: new Date(),
        ...(record.expiresAt ? { expiresAt: record.expiresAt } : {}),
      });
    }
    const collection = db().collection("sustainabilityProofs");
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await getClient().withSession((session) =>
      session.withTransaction(async () => {
        await collection.insertMany(uploads, { session });
      }),
    );
    return Response.json({
      proofs: uploads.map((proof) => ({
        id: proof._id.toString(),
        requirementId: proof.requirementId,
        name: proof.name,
        type: proof.type,
        size: proof.size,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
