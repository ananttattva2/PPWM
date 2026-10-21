import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, checkOrigin, apiError } from "@/lib/access";
export async function GET() {
  try {
    await requireUser(["admin", "super_admin"]);
    const companies = await db()
      .collection("clients")
      .find({})
      .project({ company: 1, legalName: 1, email: 1, status: 1 })
      .sort({ company: 1 })
      .limit(500)
      .toArray();
    return Response.json(
      companies.map((company) => ({
        id: company._id.toString(),
        name: company.company || company.legalName,
        email: company.email,
        status: company.status,
      })),
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await requireUser(["admin", "super_admin"]);
    const data = z
      .object({
        name: z.string().trim().min(1).max(200),
        email: z.email().toLowerCase(),
      })
      .parse(await req.json());
    const result = await db()
      .collection("clients")
      .insertOne({
        company: data.name,
        legalName: data.name,
        email: data.email,
        status: "draft",
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        documents: [],
        materials: [],
      });
    return Response.json({ id: result.insertedId.toString() }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
