"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PackagingGallery from "./packaging-gallery";
import type { PackagingComposition } from "@/lib/packaging-composition";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Eye,
  Package,
  Pencil,
  CheckCircle2,
  ChartNoAxesCombined,
  ChevronDown,
} from "lucide-react";
import { Button } from "../ui/button";
import { importFields, type PackagingRow } from "@/lib/packaging-import-schema";

export default function PackagingView({
  row,
  importId,
  onBack,
  onEdit,
  onPhotosSaved,
  onBusy,
}: {
  row: PackagingRow;
  importId: string;
  onBack: () => void;
  onEdit: () => void;
  onPhotosSaved: (composition: PackagingComposition) => void;
  onBusy: (busy: boolean) => void;
}) {
  const top = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  useEffect(() => {
    top.current?.focus();
    top.current?.scrollIntoView({ behavior: "instant", block: "start" });
  }, []);
  const composition = row.composition;
  const components = composition?.components || [];
  const total = components.reduce(
    (sum, component) => sum + (Number(component.weight) || 0),
    0,
  );
  const image = (id: string) =>
    `/api/packaging-imports/${importId}/assets/${id}`;
  return (
    <motion.div
      ref={top}
      tabIndex={-1}
      className="composition-builder composition-view"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <header className="composition-heading">
        <div>
          <span className="composition-eyebrow">
            PACKAGING WORKSPACE / {row.sku || "SKU PENDING"}
          </span>
          <h2>Packaging details</h2>
          <p>
            View saved product information, component details and uploaded
            photos.
          </p>
        </div>
        <div className="composition-heading-actions">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={uploading}
          >
            <ArrowLeft size={16} /> Back to list
          </Button>
          <Link
            className="gallery-analyse-link"
            href={`/dashboard/packaging/${importId}/${row.rowNumber}/analyse`}
            aria-label="Analyse packaging"
          >
            <ChartNoAxesCombined size={16} /> Analyse
          </Link>
          <Button type="button" onClick={onEdit} disabled={uploading}>
            <Pencil size={16} /> Edit details
          </Button>
        </div>
      </header>
      <div className="composition-view-notice">
        <Eye size={17} />
        <span>View mode · Saved details</span>
        <span className={`import-row-status ${row.status}`}>
          {row.status === "complete"
            ? "Complete"
            : row.status === "missing"
              ? "Missing data"
              : "Validation error"}
        </span>
      </div>
      <div className="composition-view-grid">
        <aside className="composition-left">
          <PackagingGallery
            row={row}
            importId={importId}
            onSaved={onPhotosSaved}
            onBusy={(busy) => {
              setUploading(busy);
              onBusy(busy);
            }}
          />
          <section className="composition-card product-identity">
            <div className="composition-sku-title">
              <Package size={24} />
              <div>
                <b>{row.productName || "Product name pending"}</b>
                <small>{row.sku || "SKU pending"}</small>
              </div>
            </div>
          </section>
        </aside>
        <section
          className="composition-middle"
          aria-label="Saved packaging components"
        >
          <section className="composition-card">
            <div className="composition-card-title">
              <div>
                <h3>
                  Packaging components{" "}
                  <span className="composition-count">{components.length}</span>
                </h3>
                <p>
                  All saved materials, weights and component-specific details.
                </p>
              </div>
              <span className="composition-view-total">
                {total.toFixed(2)} g
              </span>
            </div>
            {components.length ? (
              components.map((component, index) => (
                <article
                  className="composition-component composition-saved-component"
                  key={component.id}
                >
                  <div className="composition-component-number">
                    {index + 1}
                  </div>
                  <div className="composition-view-component-photo">
                    {component.image ? (
                      <a
                        href={image(component.image)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${component.name || `component ${index + 1}`} photo`}
                      >
                        <img
                          src={image(component.image)}
                          alt={component.name || `Component ${index + 1}`}
                        />
                      </a>
                    ) : (
                      <Package size={28} />
                    )}
                  </div>
                  <div className="composition-component-fields">
                    <div className="component-view-heading">
                      <h4>{component.name || `Component ${index + 1}`}</h4>
                      <div className="component-view-actions">
                        <Link
                          className="gallery-analyse-link component-analyse-link"
                          href={`/dashboard/packaging/${importId}/${row.rowNumber}/analyse?component=${encodeURIComponent(component.id)}`}
                          aria-label={`Analyse ${component.name || `component ${index + 1}`}`}
                        >
                          <ChartNoAxesCombined size={15} /> Analyse
                        </Link>
                        <button
                          type="button"
                          className="component-details-toggle"
                          aria-expanded={!!expanded[component.id]}
                          aria-controls={`component-details-${component.id}`}
                          aria-label={`${expanded[component.id] ? "Collapse" : "Expand"} ${component.name || `component ${index + 1}`} details`}
                          onClick={() =>
                            setExpanded((current) => ({
                              ...current,
                              [component.id]: !current[component.id],
                            }))
                          }
                        >
                          <ChevronDown size={18} />
                        </button>
                      </div>
                    </div>
                    <motion.div
                      id={`component-details-${component.id}`}
                      initial={false}
                      animate={{
                        height: expanded[component.id] ? "auto" : 0,
                        opacity: expanded[component.id] ? 1 : 0,
                      }}
                      transition={{
                        duration: reducedMotion ? 0 : 0.28,
                        ease: "easeInOut",
                      }}
                      style={{ overflow: "hidden" }}
                      aria-hidden={!expanded[component.id]}
                    >
                      <dl className="composition-view-facts component-facts">
                        {[
                          ["Polymer", component.material],
                          ["Colour", component.colour],
                          ["Weight (g)", component.weight],
                          ["Label coverage (%)", component.labelCoverage],
                          ["Adhesive type", component.adhesiveType],
                          ["Barrier layer details", component.barrierLayer],
                          ["Printing / ink details", component.printingInk],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value || "Not provided"}</dd>
                          </div>
                        ))}
                      </dl>
                    </motion.div>
                  </div>
                </article>
              ))
            ) : (
              <div className="composition-view-placeholder">
                <Package size={35} />
                <p>
                  No component details saved yet. Select Edit details to add
                  them.
                </p>
              </div>
            )}
          </section>
          <section className="composition-card">
            <h3>Packaging details from import</h3>
            <dl className="composition-view-facts component-facts">
              {importFields
                .filter((field) =>
                  [
                    "labelCoverage",
                    "adhesiveType",
                    "barrierLayer",
                    "componentWeight",
                    "printingInk",
                  ].includes(field.key),
                )
                .map((field) => (
                  <div key={field.key}>
                    <dt>{field.label}</dt>
                    <dd>
                      {row[field.key] === null || row[field.key] === ""
                        ? "Not provided"
                        : row[field.key]}
                    </dd>
                  </div>
                ))}
            </dl>
          </section>
          {row.issues.length > 0 && (
            <section className="composition-card">
              <h3>Details to complete</h3>
              <ul className="composition-view-issues">
                {row.issues.map((issue, index) => (
                  <li key={index}>{issue.message}</li>
                ))}
              </ul>
            </section>
          )}
        </section>
      </div>
      <footer className="composition-footer">
        <span>
          <CheckCircle2 size={16} />
          Viewing saved details. Changes are made in edit mode.
        </span>
        <Button type="button" onClick={onEdit} disabled={uploading}>
          <Pencil size={16} /> Edit details
        </Button>
      </footer>
    </motion.div>
  );
}
