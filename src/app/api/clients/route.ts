import { Binary } from "mongodb";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
import {
  clientSchema,
  MAX_DOCUMENT_SIZE,
  MAX_DOCUMENTS,
  documentTypes,
} from "@/lib/client-schema";
export const runtime = "nodejs";
export async function GET() {
  try {
    await requireUser();
    return Response.json(
      await db()
        .collection("clients")
        .find({})
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
    const user = await requireUser(["super_admin", "admin", "manager"]);
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
    const data = clientSchema.parse(JSON.parse(raw));
    const files = multipart.getAll("documents");
    if (!files.length || files.length > MAX_DOCUMENTS)
      return Response.json(
        { error: "Upload between 1 and 5 supporting documents." },
        { status: 400 },
      );
    const documents = [];
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
    // One atomic insert stores the profile and document bytes together. At most 10 MB of files keeps the record below MongoDB's BSON limit.
    const result = await db()
      .collection("clients")
      .insertOne({
        ...data,
        company: data.legalName,
        contact: data.authorisedPerson,
        documents,
        schemaVersion: 2,
        status: "onboarding",
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    return Response.json(
      { id: result.insertedId, message: "Client created successfully." },
      { status: 201 },
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
