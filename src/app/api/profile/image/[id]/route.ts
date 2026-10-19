import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { requireUser, apiError } from "@/lib/access";
import { readMedia } from "@/lib/cloudinary-storage";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser([
      "super_admin",
      "admin",
      "manager",
      "user",
      "compliance",
      "supplier",
    ]);
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id)) return new Response(null, { status: 404 });
    if (id !== user.id && !["admin", "super_admin"].includes(user.role))
      throw new Error("FORBIDDEN");
    const record = await db()
      .collection("user")
      .findOne({ _id: new ObjectId(id) }, { projection: { imageStorage: 1 } });
    if (!record?.imageStorage) return new Response(null, { status: 404 });
    const bytes = await readMedia({ storage: record.imageStorage });
    const format = record.imageStorage.format;
    return new Response(bytes, {
      headers: {
        "Content-Type": `image/${format === "jpg" ? "jpeg" : format}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
