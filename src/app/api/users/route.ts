import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/lib/db";
import { apiError, checkOrigin, requireUser, roles } from "@/lib/access";
import { packagingScopes } from "@/lib/packaging-scopes";
const scopeSchema = z.array(z.enum(packagingScopes)).min(1).max(8);
const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().toLowerCase(),
  password: z.string().min(12).max(128).optional(),
  role: z.enum(roles),
  active: z.boolean(),
  packagingScopes: scopeSchema.optional(),
  companyId: z
    .string()
    .regex(/^[a-f0-9]{24}$/i)
    .optional(),
});
export async function GET() {
  try {
    await requireUser(["admin", "super_admin"]);
    const users = await db()
      .collection("user")
      .find({})
      .project({
        name: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        role: 1,
        companyId: 1,
        packagingScopes: 1,
        active: 1,
        image: 1,
        createdAt: 1,
      })
      .toArray();
    return Response.json(
      users.map((u) => ({ ...u, id: u._id.toString(), _id: undefined })),
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const actor = await requireUser(["admin", "super_admin"]);
    const data = schema.parse(await req.json());
    if (
      actor.role !== "super_admin" &&
      ["admin", "super_admin"].includes(data.role)
    )
      throw new Error("FORBIDDEN");
    if (!data.password && !data.companyId)
      return Response.json(
        { error: "Initial password is required" },
        { status: 400 },
      );
    const database = db();
    if (
      data.companyId &&
      !(await database
        .collection("clients")
        .findOne({ _id: new ObjectId(data.companyId) }))
    )
      return Response.json({ error: "Company not found" }, { status: 400 });
    await database
      .collection("user")
      .createIndex({ email: 1 }, { unique: true });
    const _id = new ObjectId();
    const { password, ...fields } = data;
    await database.collection("user").insertOne({
      _id,
      ...fields,
      name: `${data.firstName} ${data.lastName}`,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    try {
      await database.collection("account").insertOne({
        userId: _id.toString(),
        accountId: _id.toString(),
        providerId: "credential",
        password: await hashPassword(
          password || randomBytes(32).toString("hex"),
        ),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (e) {
      await database.collection("user").deleteOne({ _id });
      throw e;
    }
    return Response.json({ id: _id.toString() }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(req: Request) {
  try {
    checkOrigin(req);
    const actor = await requireUser(["admin", "super_admin"]);
    const data = z
      .object({
        id: z.string().regex(/^[a-f0-9]{24}$/i),
        role: z.enum(roles),
        active: z.boolean(),
        packagingScopes: scopeSchema.optional(),
        companyId: z
          .string()
          .regex(/^[a-f0-9]{24}$/i)
          .optional(),
      })
      .parse(await req.json());
    if (
      data.companyId &&
      !(await db()
        .collection("clients")
        .findOne({ _id: new ObjectId(data.companyId) }))
    )
      return Response.json({ error: "Company not found" }, { status: 400 });
    if (data.id === actor.id) throw new Error("FORBIDDEN");
    const target = await db()
      .collection("user")
      .findOne({ _id: new ObjectId(data.id) });
    if (!target) throw new Error("Missing user");
    if (
      actor.role !== "super_admin" &&
      (["admin", "super_admin"].includes(target.role) ||
        ["admin", "super_admin"].includes(data.role))
    )
      throw new Error("FORBIDDEN");
    await db()
      .collection("user")
      .updateOne(
        { _id: target._id },
        {
          $set: {
            role: data.role,
            active: data.active,
            ...(data.packagingScopes
              ? { packagingScopes: data.packagingScopes }
              : {}),
            ...(data.companyId ? { companyId: data.companyId } : {}),
            updatedAt: new Date(),
          },
        },
      );
    await db().collection("session").deleteMany({ userId: data.id });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
