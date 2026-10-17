import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
import { assertImportAccess } from "@/lib/client-access";
import { transportPackagingSchema } from "@/lib/transport-packaging";

async function readableImport(id: string, user: Awaited<ReturnType<typeof requireUser>>) {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  const record = await db().collection("packagingImports").findOne(
    { _id: new ObjectId(id) },
    { projection: { status: 1, createdBy: 1, clientId: 1, draftClientId: 1, "analysis.rows.rowNumber": 1 } },
  );
  if (record) await assertImportAccess(user, record);
  return record;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!(await readableImport(id, user))) return Response.json({ error: "Import not found" }, { status: 404 });
    const rowNumber = Number(new URL(req.url).searchParams.get("rowNumber"));
    if (!Number.isInteger(rowNumber)) return Response.json({ error: "Invalid row" }, { status: 400 });
    const saved = await db().collection("transportPackaging").findOne({ importId: id, rowNumber });
    return Response.json(saved ? transportPackagingSchema.parse(saved) : null, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(req);
    const user = await requireUser(["super_admin", "admin", "manager", "user"]);
    const { id } = await params;
    const record = await readableImport(id, user);
    if (!record) return Response.json({ error: "Import not found" }, { status: 404 });
    const parsed = transportPackagingSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: "Enter valid transport packaging details." }, { status: 400 });
    const rowExists = record.analysis?.rows?.some((row: { rowNumber?: number }) => row.rowNumber === parsed.data.rowNumber);
    if (!rowExists) return Response.json({ error: "Packaging row not found" }, { status: 404 });
    const now = new Date();
    await db().collection("transportPackaging").updateOne(
      { importId: id, rowNumber: parsed.data.rowNumber },
      { $set: { ...parsed.data, updatedAt: now, updatedBy: user.id }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
    return Response.json(parsed.data);
  } catch (error) { return apiError(error); }
}
