import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/access";
import { db } from "@/lib/db";
import { assertImportAccess } from "@/lib/client-access";
import { canSeeAllClients, clientOwnerFilter } from "@/lib/client-permissions";
import { initialComposition } from "@/lib/packaging-composition";
import type { PackagingRow } from "@/lib/packaging-import-schema";
import {
  SkuAnalysisDirectory,
  type SkuAnalysisItem,
} from "@/components/workspace/sku-analysis";

export const metadata = { title: "SKU Analyse" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "supplier") redirect("/dashboard/supplier");
  const query = await searchParams;
  const page = Math.min(10000, Math.max(1, Number(query.page) || 1));
  const index = Math.floor(page);
  const clients = canSeeAllClients(user)
    ? []
    : await db()
        .collection("clients")
        .find(clientOwnerFilter(user), { projection: { _id: 1 } })
        .toArray();
  const ownedIds = clients.flatMap((client) => [
    client._id.toString(),
    client._id,
  ]);
  const filter = canSeeAllClients(user)
    ? {}
    : {
        $or: [
          { clientId: { $in: ownedIds } },
          { draftClientId: { $in: ownedIds } },
          {
            createdBy: user.id,
            clientId: { $in: [null, ""] },
            draftClientId: { $in: [null, ""] },
          },
        ],
      };
  const records = await db()
    .collection("packagingImports")
    .find(filter, {
      projection: {
        createdBy: 1,
        clientId: 1,
        draftClientId: 1,
        status: 1,
        "analysis.rows": 1,
      },
    })
    .sort({ _id: -1 })
    .skip((index - 1) * 20)
    .limit(21)
    .toArray();
  const items: SkuAnalysisItem[] = [];
  for (const record of records.slice(0, 20)) {
    try {
      await assertImportAccess(user, record);
    } catch {
      continue;
    }
    for (const row of (record.analysis?.rows || []) as PackagingRow[]) {
      const composition = initialComposition(row);
      items.push({
        importId: record._id.toString(),
        rowNumber: row.rowNumber,
        sku: row.sku,
        name: row.productName,
        image: composition.productImage || composition.productImages[0] || "",
      });
    }
  }
  return (
    <>
      <SkuAnalysisDirectory items={items} />
      {(index > 1 || records.length > 20) && (
        <nav
          aria-label="SKU pages"
          style={{ display: "flex", gap: 20, padding: "15px 0", fontSize: 12 }}
        >
          {index > 1 && (
            <Link href={`/dashboard/sku-analysis?page=${index - 1}`}>
              ← Previous
            </Link>
          )}
          <span>Page {index}</span>
          {records.length > 20 && (
            <Link href={`/dashboard/sku-analysis?page=${index + 1}`}>
              Next →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
