import { Binary, ObjectId } from "mongodb";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
import {
  companySchema,
  MAX_DOCUMENT_SIZE,
  MAX_DOCUMENTS,
  documentTypes,
} from "@/lib/client-schema";
import { z } from "zod";
const profileSchema = companySchema.extend({
  industry: z.string().trim().min(2).max(80),
  notes: z.string().trim().max(2000),
});
export const runtime = "nodejs";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id))
      return Response.json({ error: "Client not found" }, { status: 404 });
    const client = await db()
      .collection("clients")
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { "documents.data": 0 } },
      );
    if (!client)
      return Response.json({ error: "Client not found" }, { status: 404 });
    return Response.json(client);
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(req);
    const user = await requireUser(["super_admin", "admin", "manager"]);
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id))
      return Response.json({ error: "Client not found" }, { status: 404 });
    if (Number(req.headers.get("content-length")) > 12 * 1024 * 1024)
      throw new Error("Upload too large");
    const form = await req.formData();
    const data = profileSchema.parse(
      JSON.parse(String(form.get("data") || "{}")),
    );
    const documents = [];
    const files = form.getAll("documents");
    if (files.length > MAX_DOCUMENTS)
      throw new Error("Keep a maximum of 5 supporting documents.");
    for (const file of files) {
      if (
        !(file instanceof File) ||
        !file.size ||
        file.size > MAX_DOCUMENT_SIZE ||
        !documentTypes.includes(file.type)
      )
        throw new Error("Use PDF, PNG or JPEG documents up to 2 MB each.");
      const bytes = Buffer.from(await file.arrayBuffer());
      const valid =
        file.type === "application/pdf"
          ? bytes.subarray(0, 5).toString() === "%PDF-"
          : file.type === "image/png"
            ? bytes
                .subarray(0, 8)
                .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      if (!valid)
        throw new Error("A document does not match its declared file type.");
      documents.push({
        name: file.name.replace(/[\r\n/\\]/g, "_").slice(0, 180),
        type: file.type,
        size: file.size,
        data: new Binary(bytes),
        uploadedAt: new Date(),
        uploadedBy: user.id,
      });
    }
    const collection = db().collection<
      z.infer<typeof profileSchema> & {
        documents: typeof documents;
        updatedAt?: Date;
        company: string;
        contact: string;
        updatedBy?: string;
      }
    >("clients");
    const profile = await collection.findOne(
      { _id: new ObjectId(id) },
      { projection: { "documents.data": 0 } },
    );
    if (!profile)
      return Response.json({ error: "Client not found" }, { status: 404 });
    if ((profile.documents?.length || 0) + documents.length > MAX_DOCUMENTS)
      throw new Error("Keep a maximum of 5 supporting documents.");
    const update = await collection.updateOne(
      { _id: profile._id, updatedAt: profile.updatedAt },
      {
        $set: {
          ...data,
          company: data.legalName,
          contact: data.authorisedPerson,
          updatedAt: new Date(),
          updatedBy: user.id,
        },
        ...(documents.length
          ? { $push: { documents: { $each: documents } } }
          : {}),
      },
    );
    if (!update.matchedCount)
      return Response.json(
        { error: "This client changed while saving. Reopen it and try again." },
        { status: 409 },
      );
    return Response.json({ id, message: "Client updated successfully" });
  } catch (error) {
    if (error instanceof ZodError)
      return Response.json(
        {
          error: "Please correct the highlighted client information.",
          fields: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    if (
      error instanceof Error &&
      !["UNAUTHORIZED", "FORBIDDEN"].includes(error.message)
    )
      return Response.json(
        {
          error: [
            "Use PDF",
            "A document",
            "Keep a maximum",
            "Upload too large",
          ].some((prefix) => error.message.startsWith(prefix))
            ? error.message
            : "Could not save client changes. Please try again.",
        },
        { status: 400 },
      );
    return apiError(error);
  }
}
