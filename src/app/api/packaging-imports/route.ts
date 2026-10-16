import { groupComponentRows } from "@/lib/component-import";
import { Binary, ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { requireUser, checkOrigin, apiError } from "@/lib/access";
import {
  importSettingsSchema,
  MAX_IMPORT_SIZE,
  type ColumnMapping,
} from "@/lib/packaging-import-schema";
import {
  analysePackaging,
  parsePackagingFile,
  resolvePackagingMapping,
} from "@/lib/packaging-import";
export const runtime = "nodejs";
export async function GET() {
  try {
    const user = await requireUser(["admin", "super_admin", "manager", "user"]);
    const drafts = await db()
      .collection("packagingImports")
      .find({
        createdBy: user.id,
        status: "draft",
        draftClientId: { $exists: false },
        expiresAt: { $gt: new Date() },
      })
      .project({
        _id: 1,
        "file.name": 1,
        "analysis.summary.total": 1,
        updatedAt: 1,
        expiresAt: 1,
      })
      .sort({ updatedAt: -1 })
      .toArray();
    return Response.json(
      drafts.map((draft) => ({
        id: draft._id.toString(),
        fileName: draft.file.name,
        total: draft.analysis.summary.total,
        updatedAt: draft.updatedAt,
        expiresAt: draft.expiresAt,
      })),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await requireUser(["admin", "super_admin", "manager", "user"]);
    if (Number(req.headers.get("content-length")) > 3 * 1024 * 1024)
      return Response.json(
        { error: "Upload a file up to 2 MB." },
        { status: 413 },
      );
    const body = await req.formData();
    const file = body.get("file");
    if (!(file instanceof File) || !file.size || file.size > MAX_IMPORT_SIZE)
      return Response.json(
        { error: "Choose a CSV or XLSX file up to 2 MB." },
        { status: 400 },
      );
    const settings = importSettingsSchema.parse(
      JSON.parse(String(body.get("settings") || "{}")),
    );
    const bytes = Buffer.from(await file.arrayBuffer());
    const parsed = await parsePackagingFile(bytes, file.name, settings, false);
    const rawMapping = body.get("mapping");
    const mapping = resolvePackagingMapping(
      parsed.headers,
      typeof rawMapping === "string"
        ? (JSON.parse(rawMapping) as ColumnMapping)
        : undefined,
    );
    parsed.rawRows = groupComponentRows(parsed.rawRows, mapping);
    const analysis = analysePackaging(parsed.rawRows, mapping, settings);
    if (
      Buffer.byteLength(
        JSON.stringify({ rawRows: parsed.rawRows, analysis }),
        "utf8",
      ) >
      8 * 1024 * 1024
    )
      throw new Error(
        "Reduce the spreadsheet content. Parsed import data must be under 8 MB.",
      );
    const now = new Date();
    const metadata = {
      name: file.name.replace(/[\r\n/\\]/g, "_").slice(0, 180),
      type: file.name.toLowerCase().endsWith(".csv") ? "CSV" : "Excel (.xlsx)",
      size: file.size,
      uploadedAt: now,
      uploadedBy: user.name,
    };
    const value = {
      file: { ...metadata, data: new Binary(bytes) },
      headers: parsed.headers,
      rawRows: parsed.rawRows,
      mapping,
      settings,
      analysis,
      createdBy: user.id,
      status: "draft",
      updatedAt: now,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    };
    const collection = db().collection("packagingImports");
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    let id: ObjectId;
    const existing = body.get("importId");
    if (typeof existing === "string" && /^[a-f0-9]{24}$/i.test(existing)) {
      id = new ObjectId(existing);
      const update = await collection.updateOne(
        { _id: id, createdBy: user.id, status: "draft" },
        { $set: value },
      );
      if (!update.matchedCount) throw new Error("FORBIDDEN");
      await collection.updateOne(
        { _id: id, draftClientId: { $exists: true } },
        { $unset: { expiresAt: "" } },
      );
    } else {
      id = new ObjectId();
      await collection.insertOne({ _id: id, ...value, createdAt: now });
    }
    return Response.json({
      id: id.toString(),
      file: metadata,
      headers: parsed.headers,
      mapping,
      settings,
      analysis,
    });
  } catch (e) {
    if (
      e instanceof Error &&
      !["UNAUTHORIZED", "FORBIDDEN"].includes(e.message)
    )
      return Response.json(
        {
          error: e.message.includes("Zod")
            ? "Invalid import settings"
            : e.message,
        },
        { status: 400 },
      );
    return apiError(e);
  }
}
