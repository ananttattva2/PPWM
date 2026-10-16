import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
import {
  groupPackagingSchema,
  groupReferencesExist,
} from "@/lib/group-packaging";
import type { PackagingRow } from "@/lib/packaging-import-schema";
import { assertImportAccess } from "@/lib/client-access";
import type { ClientActor } from "@/lib/client-permissions";
export const runtime = "nodejs";
async function readableImport(id: string, user: ClientActor) {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  const record = await db()
    .collection("packagingImports")
    .findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          status: 1,
          createdBy: 1,
          clientId: 1,
          draftClientId: 1,
          "analysis.rows": 1,
        },
      },
    );
  if (record) await assertImportAccess(user, record);
  return record;
}
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!(await readableImport(id, user)))
      return Response.json({ error: "Import not found" }, { status: 404 });
    const saved = await db()
      .collection("groupPackaging")
      .findOne({ _id: new ObjectId(id) });
    return Response.json(
      { groups: saved?.groups || [], updatedAt: saved?.updatedAt || null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(req);
    const user = await requireUser(["super_admin", "admin", "manager", "user"]);
    const { id } = await params;
    const record = await readableImport(id, user);
    if (!record)
      return Response.json({ error: "Import not found" }, { status: 404 });
    const raw = await req.text();
    if (raw.length > 4000000)
      return Response.json(
        { error: "Too many component counts in this request." },
        { status: 413 },
      );
    const parsed = groupPackagingSchema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return Response.json(
        {
          error:
            "Enter whole-number counts between 0 and 100,000, with each component listed once.",
        },
        { status: 400 },
      );
    if (
      !groupReferencesExist(
        parsed.data,
        (record.analysis?.rows as PackagingRow[]) || [],
      )
    )
      return Response.json(
        {
          error:
            "These SKU components have changed. Reload the packaging workspace before saving.",
        },
        { status: 409 },
      );
    const updatedAt = new Date();
    await db()
      .collection("groupPackaging")
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: { ...parsed.data, updatedAt, updatedBy: user.id },
          $setOnInsert: { importId: id, createdAt: updatedAt },
        },
        { upsert: true },
      );
    return Response.json({ ...parsed.data, updatedAt });
  } catch (error) {
    return apiError(error);
  }
}
