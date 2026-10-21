import { allowedPackagingScopes } from "@/lib/packaging-scopes";
import { notFound, redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/access";
import { assertImportAccess } from "@/lib/client-access";
import { hydrateImportSuppliers } from "@/lib/hydrate-import-suppliers";
import type { PackagingRow } from "@/lib/packaging-import-schema";
import { supplierOwnsComponent } from "@/lib/supplier-access";
import Article5Assessment from "@/components/workspace/article-5-assessment";

export const metadata = { title: "Article 5 assessment" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; rowNumber: string }>;
  searchParams: Promise<{ component?: string | string[] }>;
}) {
  const { id, rowNumber } = await params;
  const { component: componentId } = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!allowedPackagingScopes(user).includes("sales"))
    redirect("/dashboard/clients");
  const number = Number(rowNumber);
  if (
    !/^[a-f0-9]{24}$/i.test(id) ||
    !Number.isInteger(number) ||
    typeof componentId !== "string"
  )
    notFound();
  const record = await db()
    .collection("packagingImports")
    .findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          status: 1,
          clientId: 1,
          draftClientId: 1,
          createdBy: 1,
          analysis: 1,
          headers: 1,
          mapping: 1,
          rawRows: 1,
          settings: 1,
        },
      },
    );
  if (!record) notFound();
  try {
    await assertImportAccess(user, record);
  } catch {
    notFound();
  }
  const hydrated = hydrateImportSuppliers({
    headers: record.headers,
    mapping: record.mapping || {},
    rawRows: record.rawRows,
    settings: record.settings,
    analysis: record.analysis,
  });
  const row = (hydrated.analysis?.rows as PackagingRow[] | undefined)?.find(
    (item) => item.rowNumber === number,
  );
  const component = row?.composition?.components.find(
    (item) => item.id === componentId,
  );
  if (!row || !component) notFound();
  if (
    user.role === "supplier" &&
    (record.status !== "confirmed" ||
      !supplierOwnsComponent(user.email, component))
  )
    notFound();
  const classification = await db()
    .collection("packagingClassifications")
    .findOne({ importId: id, rowNumber: number, componentId });
  const material =
    typeof classification?.family === "string"
      ? classification.family
      : component.material;
  const backHref = `/dashboard/packaging/${id}/${number}/analyse?component=${encodeURIComponent(componentId)}&section=articles`;
  return (
    <Article5Assessment
      key={`${user.id}-${id}-${number}-${componentId}`}
      componentName={component.name || "Unnamed component"}
      productName={row.productName || "Product name pending"}
      material={material}
      backHref={backHref}
    />
  );
}
