export type ClientActor = { id: string; role: string };

export function canSeeAllClients(user: ClientActor) {
  return ["admin", "super_admin"].includes(user.role);
}

export function clientOwnerFilter(user: ClientActor) {
  return canSeeAllClients(user) ? {} : { createdBy: user.id };
}

export function canAccessClient(
  user: ClientActor,
  client: { [key: string]: unknown; createdBy?: unknown },
) {
  return (
    user.role !== "supplier" &&
    (canSeeAllClients(user) || client.createdBy === user.id)
  );
}

export const clientEditorRoles = [
  "super_admin",
  "admin",
  "manager",
  "user",
] as const;
