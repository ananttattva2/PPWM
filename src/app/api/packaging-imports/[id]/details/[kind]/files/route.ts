import { mediaTypes } from "@/lib/media-types";
import { readMedia } from "@/lib/cloudinary-storage";
import { storeMedia } from "@/lib/cloudinary-storage";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { apiError, checkOrigin } from "@/lib/access";
import { detailAccess } from "@/lib/additional-packaging-access";
import { packagingDetails } from "@/lib/additional-packaging";
import { validProofSignature } from "@/lib/sustainability-proof";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string; kind: string }> };
export async function POST(req: Request, { params }: Context) {
  try {
    checkOrigin(req);
    if (Number(req.headers.get("content-length")) > 3 * 1024 * 1024)
      return Response.json({ error: "Use files up to 2 MB." }, { status: 413 });
    const { id, kind } = await params;
    const form = await req.formData();
    const rowNumber = Number(form.get("rowNumber"));
    const access = await detailAccess(id, kind, rowNumber, true);
    if (!access)
      return Response.json(
        { error: "Packaging row not found" },
        { status: 404 },
      );
    const slot = String(form.get("slot") || "");
    const file = form.get("file");
    if (
      !["photo", ...packagingDetails[access.kind].uploads].includes(slot) ||
      !(file instanceof File) ||
      !file.size ||
      file.size > 2 * 1024 * 1024 ||
      !(mediaTypes as readonly string[]).includes(file.type) ||
      (slot === "photo" && !file.type.startsWith("image/"))
    )
      return Response.json(
        {
          error:
            "Use PNG, JPG, WEBP or PDF files up to 2 MB (photos must be images).",
        },
        { status: 400 },
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!validProofSignature(file.type, bytes))
      return Response.json(
        { error: "File contents do not match the selected type." },
        { status: 400 },
      );
    const fileId = new ObjectId();
    const name = file.name.slice(0, 180);
    await db()
      .collection("packagingDetailFiles")
      .insertOne({
        _id: fileId,
        importId: id,
        kind,
        rowNumber,
        slot,
        name,
        type: file.type,
        ...(await storeMedia(bytes, file.name, file.type)),
        createdAt: new Date(),
        createdBy: access.user.id,
      });
    return Response.json({ id: fileId.toHexString(), name, type: file.type });
  } catch (error) {
    return apiError(error);
  }
}
export async function GET(req: Request, { params }: Context) {
  try {
    const { id, kind } = await params;
    const query = new URL(req.url).searchParams;
    const rowNumber = Number(query.get("rowNumber"));
    if (!(await detailAccess(id, kind, rowNumber)))
      return new Response(null, { status: 404 });
    const assetId = query.get("asset") || "";
    if (!/^[a-f0-9]{24}$/i.test(assetId))
      return new Response(null, { status: 404 });
    const file = await db()
      .collection("packagingDetailFiles")
      .findOne({ _id: new ObjectId(assetId), importId: id, kind, rowNumber });
    if (!file) return new Response(null, { status: 404 });
    return new Response(await readMedia(file), {
      headers: {
        "Content-Type": file.type,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
