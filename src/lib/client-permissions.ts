export type ClientActor = {
  id: string;
  role: string;
  companyId?: string;
  packagingScopes?: unknown;
};

export function canSeeAllClients(user: ClientActor) {
  return ["admin", "super_admin"].includes(user.role);
}

export function clientOwnerFilter(user: ClientActor) {
  return canSeeAllClients(user)
    ? {}
    : user.companyId
      ? {
          $or: [
            { createdBy: user.id },
            { $expr: { $eq: [{ $toString: "$_id" }, user.companyId] } },
          ],
        }
      : { createdBy: user.id };
}

export function canAccessClient(
  user: ClientActor,
  client: { [key: string]: unknown; createdBy?: unknown },
) {
  return (
    user.role !== "supplier" &&
    (canSeeAllClients(user) ||
      client.createdBy === user.id ||
      Boolean(user.companyId && String(client._id) === user.companyId))
  );
}

export const clientEditorRoles = [
  "super_admin",
  "admin",
  "manager",
  "user",
] as const;
