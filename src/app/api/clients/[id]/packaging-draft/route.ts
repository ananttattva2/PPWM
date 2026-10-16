import { ObjectId } from "mongodb";
import { z } from "zod";
import { db, getClient } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
import { clientEditorRoles } from "@/lib/client-permissions";
import { assertClientAccess } from "@/lib/client-access";

export const runtime = "nodejs";
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(req);
    const user = await requireUser(clientEditorRoles);
    const { id } = await params;
    const clientId = z
      .string()
      .regex(/^[a-f0-9]{24}$/i)
      .parse(id);
    const { importId } = z
      .object({ importId: z.string().regex(/^[a-f0-9]{24}$/i) })
      .parse(await req.json());
    const database = db();
    await getClient().withSession((session) =>
      session.withTransaction(async () => {
        const profile = await database
          .collection("clients")
          .findOne({ _id: new ObjectId(clientId) }, { session });
        const draft = await database.collection("packagingImports").findOne(
          {
            _id: new ObjectId(importId),
            createdBy: user.id,
            status: "draft",
          },
          { session },
        );
        if (profile) assertClientAccess(user, profile);
        if (
          !profile ||
          profile.packagingImport ||
          !draft ||
          (draft.draftClientId && draft.draftClientId !== clientId)
        )
          throw new Error("FORBIDDEN");
        await database
          .collection("clients")
          .updateOne(
            { _id: profile._id },
            { $set: { packagingDraftId: importId, updatedAt: new Date() } },
            { session },
          );
        await database
          .collection("packagingImports")
          .updateOne(
            { _id: draft._id },
            { $set: { draftClientId: clientId }, $unset: { expiresAt: "" } },
            { session },
          );
        await database
          .collection("packagingAssets")
          .updateMany({ importId }, { $unset: { expiresAt: "" } }, { session });
      }),
    );
    return Response.json({ id: clientId, importId });
  } catch (error) {
    return apiError(error);
  }
}
