import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
const schema = z.object({
  company: z.string().trim().min(2).max(160),
  contact: z.string().trim().min(2).max(160),
  email: z.email(),
  country: z.string().min(2).max(80),
  industry: z.string().min(2).max(80),
  materials: z
    .array(z.enum(["Plastic", "Paper & board", "Metal", "Glass", "Other"]))
    .min(1),
  notes: z.string().max(2000),
});
export async function GET() {
  try {
    await requireUser();
    return Response.json(
      await db()
        .collection("clients")
        .find({})
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray(),
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await requireUser(["super_admin", "admin", "manager"]);
    const data = schema.parse(await req.json());
    const result = await db()
      .collection("clients")
      .insertOne({
        ...data,
        status: "onboarding",
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    return Response.json({ id: result.insertedId }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
