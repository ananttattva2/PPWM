import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import {
  ArrowLeft,
  ChartNoAxesCombined,
  CheckCircle2,
  AlertCircle,
  Package,
} from "lucide-react";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/access";
import { packagingAnalysis } from "@/lib/packaging-analysis";
import type { PackagingRow } from "@/lib/packaging-import-schema";
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
          createdBy: 1,
          "analysis.rows": 1,
        },
      },
    );
  if (!record || (record.status === "draft" && record.createdBy !== user.id))
    notFound();
  const row = (record.analysis?.rows as PackagingRow[] | undefined)?.find(
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
  if (selectedComponent) {
    const details = [
      ["Material", selectedComponent.material],
      ["Colour", selectedComponent.colour],
      ["Weight (g)", selectedComponent.weight],
      ["Label coverage (%)", selectedComponent.labelCoverage],
      ["Adhesive type", selectedComponent.adhesiveType],
      ["Barrier layer details", selectedComponent.barrierLayer],
      ["Printing / ink details", selectedComponent.printingInk],
    ];
    const missing = details.filter(([, value]) => !value);
    const weight = Number(selectedComponent.weight) || 0;
    const share =
      analysis.total > 0 && selectedComponent.weight
        ? `${((weight / analysis.total) * 100).toFixed(1)}%`
        : "Not available";
    const checks: [string, boolean | null][] = [
      ["Material provided", selectedComponent.material ? true : null],
      [
        "Positive component weight",
        selectedComponent.weight ? weight > 0 : null,
      ],
      [
        "Label coverage between 0 and 100",
        selectedComponent.labelCoverage
          ? /^\d+(\.\d+)?$/.test(selectedComponent.labelCoverage) &&
            Number(selectedComponent.labelCoverage) <= 100
          : null,
      ],
    ];
    return (
      <div className="composition-builder packaging-analysis component-analysis">
        <header className="composition-heading">
          <div>
            <span className="composition-eyebrow">
              PACKAGING WORKSPACE / {row.sku || "SKU PENDING"}
            </span>
            <h1>Component analysis</h1>
            <p>
              {selectedComponent.name || "Unnamed component"} ·{" "}
              {row.productName || "Product name pending"}. Based on saved
              component details.
            </p>
          </div>
          <Link
            className="gallery-analyse-link"
            href={`/dashboard/packaging/${id}/${number}/analyse`}
          >
            <ArrowLeft size={16} /> Full packaging analysis
          </Link>
        </header>
        <div className="composition-view-notice">
          <ChartNoAxesCombined size={18} />
          <span>
            {selectedComponent.name || "Unnamed component"} ·{" "}
            {row.sku || "SKU pending"}
          </span>
        </div>
        <div className="analysis-stats">
          {[
            [
              "Component weight",
              selectedComponent.weight
                ? `${weight.toFixed(2)} g`
                : "Not provided",
            ],
            ["Share of component total", share],
            [
              "Imported packaging weight",
              row.weight === null
                ? "Not provided"
                : `${row.weight.toFixed(2)} g`,
            ],
            ["Missing component details", String(missing.length)],
          ].map(([label, value]) => (
            <section className="composition-card" key={label}>
              <small>{label}</small>
              <b>{value}</b>
            </section>
          ))}
        </div>
        <div className="composition-view-grid">
          <section className="composition-card">
            <h3>Component preview</h3>
            <div className="composition-sku-title">
              <Package size={24} />
              <div>
                <b>{selectedComponent.name || "Unnamed component"}</b>
                <small>{row.productName || row.sku}</small>
              </div>
            </div>
            {selectedComponent.image ? (
              <a
                className="composition-view-photo"
                href={`/api/packaging-imports/${id}/assets/${selectedComponent.image}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Open component photo"
              >
                <img
                  src={`/api/packaging-imports/${id}/assets/${selectedComponent.image}`}
                  alt={selectedComponent.name || "Component"}
                />
              </a>
            ) : (
              <div className="composition-view-placeholder">
                <Package size={36} />
                <p>No component photo uploaded</p>
              </div>
            )}
            <h3 className="analysis-material-heading">Data checks</h3>
            <div className="composition-validation">
              {checks.map(([label, valid]) => (
                <p key={label} className={valid === true ? "valid" : "pending"}>
                  {valid === true ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  {label} ·{" "}
                  {valid === null
                    ? "Not provided"
                    : valid
                      ? "Passed"
                      : "Needs correction"}
                </p>
              ))}
            </div>
          </section>
          <section className="composition-card">
            <h3>Saved component details</h3>
            <dl className="composition-view-facts component-facts">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "Not provided"}</dd>
                </div>
              ))}
            </dl>
            <h3 className="analysis-material-heading">Details to complete</h3>
            {missing.length ? (
              <ul className="composition-view-issues">
                {missing.map(([label]) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            ) : (
              <p className="composition-help">
                All component details have values.
              </p>
            )}
          </section>
        </div>
      </div>
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
        <Link className="gallery-analyse-link" href="/dashboard/clients">
          <ArrowLeft size={16} /> Back to clients
        </Link>
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
          <h3 className="analysis-material-heading">Material distribution</h3>
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
                  <th>Material</th>
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
