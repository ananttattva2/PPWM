import { ObjectId } from "mongodb";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
import { storeMedia } from "@/lib/cloudinary-storage";
import { validMediaSignature } from "@/lib/media-types";
export async function PATCH(req: Request) {
  try {
    checkOrigin(req);
    const user = await requireUser([
      "super_admin",
      "admin",
      "manager",
      "compliance",
      "user",
      "supplier",
    ]);
    const data = z
      .object({
        firstName: z.string().trim().min(1).max(80),
        lastName: z.string().trim().min(1).max(80),
        image: z
          .string()
          .max(1500000)
          .refine(
            (s) =>
              s === "" ||
              s === user.image ||
              /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s),
          ),
      })
      .parse(await req.json());
    let imageStorage;
    if (data.image.startsWith("data:image/")) {
      const [prefix, encoded] = data.image.split(",");
      const type = prefix.slice(5).split(";")[0];
      const bytes = Buffer.from(encoded, "base64");
      if (!validMediaSignature(type, bytes))
        throw new Error("Invalid profile image.");
      imageStorage = (
        await storeMedia(bytes, `profile.${type.split("/")[1]}`, type)
      ).storage;
      data.image = `/api/profile/image/${user.id}`;
    }
    await db()
      .collection("user")
      .updateOne(
        { _id: new ObjectId(user.id) },
        {
          $set: {
            ...data,
            ...(imageStorage ? { imageStorage } : {}),
            name: `${data.firstName} ${data.lastName}`,
            updatedAt: new Date(),
          },
        },
      );
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
