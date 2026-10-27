import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/access";
import { db } from "@/lib/db";
import { assertImportAccess } from "@/lib/client-access";
import { canSeeAllClients, clientOwnerFilter } from "@/lib/client-permissions";
import { initialComposition } from "@/lib/packaging-composition";
import type { PackagingRow } from "@/lib/packaging-import-schema";
import { ObjectId } from "mongodb";
import {
  SkuAnalysisDirectory,
  type SkuAnalysisItem,
} from "@/components/workspace/sku-analysis";

export const metadata = { title: "SKU Analyse" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; packaging?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "supplier") redirect("/dashboard/supplier");
  const query = await searchParams;
  const packagingId = query.packaging;
  const page = Math.min(10000, Math.max(1, Number(query.page) || 1));
  const index = Math.floor(page);
  let records;
  if (packagingId) {
    if (!/^[a-f0-9]{24}$/i.test(packagingId)) redirect("/dashboard/sku-analysis");
    const record = await db()
      .collection("packagingImports")
      .findOne(
        { _id: new ObjectId(packagingId) },
        {
          projection: {
            createdBy: 1,
            clientId: 1,
            draftClientId: 1,
            status: 1,
            "analysis.rows": 1,
          },
        },
      );
    if (!record) redirect("/dashboard/sku-analysis");
    try {
      await assertImportAccess(user, record);
    } catch {
      redirect("/dashboard/sku-analysis");
    }
    records = [record];
  } else {
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
    records = await db()
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
  }
  const items: SkuAnalysisItem[] = [];
  for (const record of packagingId ? records : records.slice(0, 20)) {
    if (!packagingId) {
      try {
        await assertImportAccess(user, record);
      } catch {
        continue;
      }
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
      <SkuAnalysisDirectory
        items={items}
        backHref="/dashboard/clients"
        backLabel="Client onboarding"
        title={packagingId ? "Client SKU analysis" : "SKU Analyse"}
        description={
          packagingId
            ? "Review this client’s SKU list and open saved packaging details."
            : "Explore your SKUs and open saved packaging details."
        }
      />
      {!packagingId && (index > 1 || records.length > 20) && (
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
