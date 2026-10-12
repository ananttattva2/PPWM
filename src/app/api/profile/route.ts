import { ObjectId } from "mongodb";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
export async function PATCH(req: Request) {
  try {
    checkOrigin(req);
    const user = await requireUser();
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
              /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s),
          ),
      })
      .parse(await req.json());
    await db()
      .collection("user")
      .updateOne(
        { _id: new ObjectId(user.id) },
        {
          $set: {
            ...data,
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
