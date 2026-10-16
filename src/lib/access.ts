import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import { ObjectId } from "mongodb";
export const roles = [
  "super_admin",
  "admin",
  "manager",
  "compliance",
  "user",
  "supplier",
] as const;
export async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const record = await db()
    .collection("user")
    .findOne({ _id: new ObjectId(session.user.id) });
  if (!record || record.active === false) return null;
  return {
    ...session.user,
    role: String(record.role || "user"),
    firstName: String(record.firstName || ""),
    lastName: String(record.lastName || ""),
    name: String(record.name),
    image: record.image as string | undefined,
  };
}
export async function requireUser(allowed?: readonly string[]) {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (!allowed && user.role === "supplier") throw new Error("FORBIDDEN");
  if (allowed && !allowed.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
export function checkOrigin(req: Request) {
  if (req.headers.get("origin") !== new URL(req.url).origin)
    throw new Error("FORBIDDEN");
}
export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return Response.json(
    {
      error:
        message === "UNAUTHORIZED"
          ? "Please sign in"
          : message === "FORBIDDEN"
            ? "Access denied"
            : "Request could not be completed",
    },
    {
      status:
        message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400,
    },
  );
}
