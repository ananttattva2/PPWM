import { validMediaSignature } from "@/lib/media-types";
import { storeMedia } from "@/lib/cloudinary-storage";
import { ObjectId } from "mongodb";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
import { clientEditorRoles } from "@/lib/client-permissions";
import { assertClientAccess } from "@/lib/client-access";
import {
  companySchema,
  MAX_DOCUMENT_SIZE,
  MAX_DOCUMENTS,
  documentTypes,
} from "@/lib/client-schema";
import { z } from "zod";
const profileSchema = companySchema.extend({
  operatorStatus: companySchema.shape.operatorStatus.optional(),
  obligationsByRole: companySchema.shape.obligationsByRole.optional(),
  industry: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export const runtime = "nodejs";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
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
    assertClientAccess(user, client);
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
    const user = await requireUser(clientEditorRoles);
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id))
      return Response.json({ error: "Client not found" }, { status: 404 });
    const authorizedClient = await db()
      .collection("clients")
      .findOne({ _id: new ObjectId(id) }, { projection: { createdBy: 1 } });
    if (!authorizedClient)
      return Response.json({ error: "Client not found" }, { status: 404 });
    assertClientAccess(user, authorizedClient);
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
        throw new Error(
          "Use supported image, video, PDF, Excel or document documents up to 2 MB each.",
        );
      const bytes = Buffer.from(await file.arrayBuffer());
      const valid = validMediaSignature(file.type, bytes);
      if (!valid)
        throw new Error("A document does not match its declared file type.");
      documents.push({
        name: file.name.replace(/[\r\n/\\]/g, "_").slice(0, 180),
        type: file.type,
        size: file.size,
        ...(await storeMedia(bytes, file.name, file.type)),
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
        createdBy?: string;
      }
    >("clients");
    const profile = await collection.findOne(
      { _id: new ObjectId(id) },
      { projection: { "documents.data": 0 } },
    );
    if (!profile)
      return Response.json({ error: "Client not found" }, { status: 404 });
    assertClientAccess(user, profile);
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
