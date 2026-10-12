import { MongoClient } from "mongodb";
import { hashPassword } from "better-auth/crypto";
import { randomBytes } from "node:crypto";
import { setServers } from "node:dns";
if (process.env.MONGODB_DNS_SERVERS)
  setServers(process.env.MONGODB_DNS_SERVERS.split(","));
const email = process.argv[2]?.toLowerCase();
const firstName = process.argv[3] || "Workspace";
const lastName = process.argv[4] || "Administrator";
const role = process.argv[5] || "super_admin";
if (!["admin", "super_admin"].includes(role))
  throw new Error("Role must be admin or super_admin");
if (!email || !/^\S+@\S+\.\S+$/.test(email))
  throw new Error(
    "Usage: npm run bootstrap-admin -- owner@company.com First Last",
  );
const client = new MongoClient(process.env.MONGODB_URI!);
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "ppwm");
  await db.collection("user").createIndex({ email: 1 }, { unique: true });
  if (await db.collection("user").findOne({ email }))
    throw new Error(
      "User already exists; bootstrap will not overwrite or elevate an existing account",
    );
  const created = await db.collection("user").insertOne({
    email,
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    role,
    active: true,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const id = created.insertedId.toString();
  await db.collection("account").insertOne({
    userId: id,
    accountId: id,
    providerId: "credential",
    password: await hashPassword(randomBytes(48).toString("base64url")),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(
    "Super admin provisioned. Sign in with an email OTP; set a password from your profile.",
  );
} finally {
  await client.close();
}
