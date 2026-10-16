import { assertImportAccess } from "@/lib/client-access";
import { hydrateImportSuppliers } from "@/lib/hydrate-import-suppliers";
import PackagingBackLink from "@/components/workspace/packaging-back-link";
import ComponentClassification from "@/components/workspace/component-classification";
import { classificationSchema } from "@/lib/packaging-classification";
import { notFound, redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import {
  ChartNoAxesCombined,
  CheckCircle2,
  AlertCircle,
  Package,
} from "lucide-react";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/access";
import { packagingAnalysis } from "@/lib/packaging-analysis";
import type { PackagingRow } from "@/lib/packaging-import-schema";
import { supplierOwnsComponent } from "@/lib/supplier-access";
export const metadata = { title: "Packaging analysis" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; rowNumber: string }>;
  searchParams: Promise<{ component?: string | string[] }>;
}) {
  const { id, rowNumber } = await params;
  const user = await currentUser();
  if (!user) redirect("/login");
  const number = Number(rowNumber);
  if (
    !/^[a-f0-9]{24}$/i.test(id) ||
    !Number.isInteger(number) ||
    number < 1 ||
    number > 1001
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
  if (!row) notFound();
  const analysis = packagingAnalysis(row);
  const { component: componentId } = await searchParams;
  const selectedComponent =
    typeof componentId === "string"
      ? row.composition?.components.find(
          (component) => component.id === componentId,
        )
      : undefined;
  if (componentId !== undefined && !selectedComponent) notFound();
  if (user.role === "supplier") {
    if (record.status !== "confirmed") notFound();
    if (!selectedComponent) redirect("/dashboard/supplier");
    if (!supplierOwnsComponent(user.email, selectedComponent)) notFound();
  }
  if (selectedComponent) {
    const saved = await db().collection("packagingClassifications").findOne({
      importId: id,
      rowNumber: number,
      componentId: selectedComponent.id,
    });
    const classification = classificationSchema.safeParse(saved);
    return (
      <ComponentClassification
        key={`${id}-${number}-${selectedComponent.id}`}
        importId={id}
        rowNumber={number}
        componentId={selectedComponent.id}
        componentName={selectedComponent.name || "Unnamed component"}
        componentImage={selectedComponent.image}
        productName={row.productName || "Product name pending"}
        polymer={selectedComponent.material}
        supplierDetails={selectedComponent}
        initial={classification.success ? classification.data : undefined}
        canEdit={[
          "super_admin",
          "admin",
          "manager",
          "user",
          "supplier",
        ].includes(user.role)}
        supplierView={user.role === "supplier"}
      />
    );
  }
  const colours = ["#21a675", "#5685ee", "#f7ae28", "#c67ee6", "#e57386"];
  return (
    <div className="composition-builder packaging-analysis">
      <header className="composition-heading">
        <div>
          <span className="composition-eyebrow">
            PACKAGING WORKSPACE / {row.sku || "SKU PENDING"}
          </span>
          <h1>Packaging analysis</h1>
          <p>
            Weight reconciliation and data checks for{" "}
            {row.productName || "this product"}. Based on saved details.
          </p>
        </div>
        <PackagingBackLink importId={id} rowNumber={number} />
      </header>
      <div className="composition-view-notice">
        <ChartNoAxesCombined size={18} />
        <span>
          {row.productName || "Product name pending"} ·{" "}
          {row.sku || "SKU pending"}
        </span>
      </div>
      <div className="analysis-stats">
        {[
          [
            "Imported packaging weight",
            row.weight === null ? "Not provided" : `${row.weight.toFixed(2)} g`,
          ],
          ["Component weight total", `${analysis.total.toFixed(2)} g`],
          [
            "Components saved",
            `${row.composition?.components.length || 0} / ${row.components ?? "—"}`,
          ],
          ["Missing import fields", String(analysis.missing.length)],
        ].map(([label, value]) => (
          <section className="composition-card" key={label}>
            <small>{label}</small>
            <b>{value}</b>
          </section>
        ))}
      </div>
      <div className="composition-view-grid">
        <section className="composition-card">
          <h3>Weight reconciliation</h3>
          <div
            className={`analysis-result ${analysis.matches ? "matches" : "pending"}`}
          >
            {analysis.matches ? (
              <CheckCircle2 size={28} />
            ) : (
              <AlertCircle size={28} />
            )}
            <div>
              <b>
                {analysis.matches
                  ? "Component weights match"
                  : analysis.weightsComplete
                    ? "Weights need attention"
                    : "Component weights are incomplete"}
              </b>
              <p>
                Difference:{" "}
                {row.weight === null
                  ? "Imported total not provided"
                  : `${Math.abs(analysis.total - row.weight).toFixed(2)} g`}
              </p>
            </div>
          </div>
          <dl className="composition-view-facts">
            <div>
              <dt>Component count</dt>
              <dd>
                {analysis.countMatches
                  ? "Matches imported count"
                  : "Does not yet match imported count"}
              </dd>
            </div>
            <div>
              <dt>Import validation errors</dt>
              <dd>
                {row.issues.filter((issue) => issue.kind === "error").length}
              </dd>
            </div>
          </dl>
          <h3 className="analysis-material-heading">Polymer distribution</h3>
          <div className="composition-weight-bar">
            {analysis.materials.map((item, index) => (
              <span
                key={item.material}
                style={{
                  width: `${item.percentage}%`,
                  background: colours[index % colours.length],
                }}
              />
            ))}
          </div>
          {analysis.materials.length ? (
            analysis.materials.map((item, index) => (
              <div className="composition-weight-legend" key={item.material}>
                <i style={{ background: colours[index % colours.length] }} />
                <span>
                  {item.material} · {item.percentage.toFixed(1)}%
                </span>
                <b>{item.weight.toFixed(2)} g</b>
              </div>
            ))
          ) : (
            <p className="composition-help">
              Add component materials and weights in the editor to see a
              breakdown.
            </p>
          )}
        </section>
        <section className="composition-card">
          <h3>Component breakdown</h3>
          <div className="analysis-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Polymer</th>
                  <th>Weight (g)</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {row.composition?.components.map((component, index) => (
                  <tr key={component.id}>
                    <td>{component.name || `Component ${index + 1}`}</td>
                    <td>{component.material || "Not provided"}</td>
                    <td>{component.weight || "Not provided"}</td>
                    <td>
                      {analysis.total
                        ? `${((Number(component.weight) / analysis.total) * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!row.composition?.components.length && (
            <div className="composition-view-placeholder">
              <Package size={30} />
              <p>No components saved yet.</p>
            </div>
          )}
          <h3 className="analysis-material-heading">Details to complete</h3>
          {analysis.missing.length ? (
            <ul className="composition-view-issues">
              {analysis.missing.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          ) : (
            <p className="composition-help">All import fields have values.</p>
          )}
        </section>
      </div>
    </div>
  );
}
