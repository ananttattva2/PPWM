import "server-only";
import { ObjectId } from "mongodb";
import { db } from "./db";
import {
  canAccessClient,
  canSeeAllClients,
  type ClientActor,
} from "./client-permissions";

export function assertClientAccess(
  user: ClientActor,
  client: { [key: string]: unknown; createdBy?: unknown },
) {
  if (!canAccessClient(user, client)) throw new Error("FORBIDDEN");
}

export async function assertImportAccess(
  user: ClientActor,
  record: {
    [key: string]: unknown;
    createdBy?: unknown;
    clientId?: unknown;
    draftClientId?: unknown;
    status?: unknown;
  },
) {
  // Supplier callers must also check the requested component against their email.
  if (user.role === "supplier") {
    if (record.status !== "confirmed") throw new Error("FORBIDDEN");
    return;
  }
  if (canSeeAllClients(user)) return;
  const linkedId = record.clientId || record.draftClientId;
  if (linkedId) {
    const value = String(linkedId);
    if (user.companyId === value) return;
    if (!/^[a-f0-9]{24}$/i.test(value)) throw new Error("FORBIDDEN");
    const client = await db()
      .collection("clients")
      .findOne({ _id: new ObjectId(value) }, { projection: { createdBy: 1 } });
    if (!client) throw new Error("FORBIDDEN");
    assertClientAccess(user, client);
  } else if (record.createdBy !== user.id) throw new Error("FORBIDDEN");
}
