import { ObjectId } from "mongodb";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(req);
    const user = await requireUser(["super_admin", "admin", "manager"]);
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id))
      return Response.json({ error: "Client not found" }, { status: 404 });
    const { answer } = z
      .object({ answer: z.enum(["yes", "no"]) })
      .parse(await req.json());
    const result = await db()
      .collection("clients")
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            exemptionAnswer: answer,
            updatedAt: new Date(),
            updatedBy: user.id,
          },
        },
      );
    if (!result.matchedCount)
      return Response.json({ error: "Client not found" }, { status: 404 });
    return Response.json({ answer });
  } catch (error) {
    return apiError(error);
  }
}
