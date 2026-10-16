import { ObjectId } from "mongodb";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
import { clientOwnerFilter, clientEditorRoles } from "@/lib/client-permissions";
import { restrictedPackagingFormats } from "@/lib/client-schema";
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(req);
    const user = await requireUser(clientEditorRoles);
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id))
      return Response.json({ error: "Client not found" }, { status: 404 });
    const { answer, responses } = z
      .object({
        answer: z.enum(["yes", "no"]),
        responses: z.record(z.string(), z.enum(["yes", "no"])).default({}),
      })
      .parse(await req.json());
    const allowedIds = new Set<string>(
      restrictedPackagingFormats.map(({ id }) => id),
    );
    const restrictedPackagingAnswers = Object.fromEntries(
      Object.entries(responses).filter(([key]) => allowedIds.has(key)),
    );
    if (
      answer === "yes" &&
      restrictedPackagingFormats.some(
        ({ id }) => !restrictedPackagingAnswers[id],
      )
    )
      return Response.json(
        { error: "Answer every restricted packaging format question." },
        { status: 400 },
      );
    const result = await db()
      .collection("clients")
      .updateOne(
        { _id: new ObjectId(id), ...clientOwnerFilter(user) },
        {
          $set: {
            restrictedPackagingObligation: answer,
            restrictedPackagingAnswers:
              answer === "yes" ? restrictedPackagingAnswers : {},
            updatedAt: new Date(),
            updatedBy: user.id,
          },
          $unset: { exemptionAnswer: "" },
        },
      );
    if (!result.matchedCount)
      return Response.json({ error: "Client not found" }, { status: 404 });
    return Response.json({ answer, responses: restrictedPackagingAnswers });
  } catch (error) {
    return apiError(error);
  }
}
