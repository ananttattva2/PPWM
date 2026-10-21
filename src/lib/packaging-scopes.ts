export const packagingScopes = [
  "sales",
  "group",
  "transport",
  "ecommerce",
  "service",
  "reuse",
  "beverage",
  "composite",
] as const;
export type PackagingScope = (typeof packagingScopes)[number];
export const packagingScopeOptions = [
  { value: "sales", label: "Sales Packaging" },
  { value: "group", label: "Group Packaging" },
  { value: "transport", label: "Transport Packaging" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "service", label: "Service Packaging" },
  { value: "reuse", label: "Re-use / Refill" },
  { value: "beverage", label: "Beverage / DRS" },
  { value: "composite", label: "Composite / Multi-material" },
];
export function allowedPackagingScopes(user: {
  role: string;
  packagingScopes?: unknown;
}): readonly PackagingScope[] {
  if (
    ["admin", "super_admin"].includes(user.role) ||
    user.packagingScopes === undefined
  )
    return packagingScopes;
  return Array.isArray(user.packagingScopes)
    ? packagingScopes.filter((scope) =>
        (user.packagingScopes as unknown[]).includes(scope),
      )
    : [];
}
export function assertPackagingScope(
  user: { role: string; packagingScopes?: unknown },
  scope: PackagingScope,
) {
  if (!allowedPackagingScopes(user).includes(scope))
    throw new Error("FORBIDDEN");
}
