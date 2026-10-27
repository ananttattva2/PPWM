"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { rememberPackagingWorkspace } from "@/lib/packaging-navigation";
import PackagingGallery from "./packaging-gallery";
import {
  distinctPhysicalComponents,
  type PackagingComposition,
} from "@/lib/packaging-composition";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Package,
  Pencil,
  CheckCircle2,
  ChartNoAxesCombined,
  Upload,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { type PackagingRow } from "@/lib/packaging-import-schema";

export default function PackagingView({
  row,
  importId,
  onBack,
  backLabel = "Back to list",
  onEdit,
  onPhotosSaved,
  onBusy,
  canEdit = true,
}: {
  canEdit?: boolean;
  row: PackagingRow;
  importId: string;
  onBack: () => void;
  backLabel?: string;
  onEdit: () => void;
  onPhotosSaved: (composition: PackagingComposition) => void;
  onBusy: (busy: boolean) => void;
}) {
  const top = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [uploading, setUploading] = useState(false);
  const [uploadingComponent, setUploadingComponent] = useState<string | null>(
    null,
  );
  useEffect(() => {
    top.current?.focus();
    top.current?.scrollIntoView({ behavior: "instant", block: "start" });
  }, []);
  const composition = row.composition;
  const components = composition?.components || [];
  const physicalComponents = distinctPhysicalComponents(components);
  const total = physicalComponents.reduce(
    (sum, component) => sum + (Number(component.weight) || 0),
    0,
  );
  const image = (id: string) =>
    `/api/packaging-imports/${importId}/assets/${id}`;
  async function uploadComponent(componentId: string, file?: File) {
    if (!file || uploading || !canEdit) return;
    if (
      !file.size ||
      file.size > 2 * 1024 * 1024 ||
      !["image/png", "image/jpeg"].includes(file.type)
    ) {
      toast.error("Use a PNG or JPEG photo up to 2 MB.");
      return;
    }
    setUploading(true);
    setUploadingComponent(componentId);
    onBusy(true);
    try {
      const data = new FormData();
      data.append("rowNumber", String(row.rowNumber));
      data.append("componentId", componentId);
      data.append("photos", file);
      const response = await fetch(
        `/api/packaging-imports/${importId}/photos`,
        { method: "POST", body: data },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not save component photo.");
      onPhotosSaved(result.composition);
      toast.success("Component photo uploaded and saved");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
      setUploadingComponent(null);
      onBusy(false);
    }
  }
  return (
    <motion.div
      ref={top}
      tabIndex={-1}
      className="composition-builder composition-view"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <header className="composition-heading composition-view-topbar">
        <div className="composition-view-heading-copy">
          <span className="composition-eyebrow">
            PACKAGING WORKSPACE / {row.sku || "SKU PENDING"}
          </span>
          <h2>Packaging details</h2>
          <p>
            View saved product information, component details and uploaded
            photos.
          </p>
          <section
            className="composition-view-product-identity"
            aria-label="Product identity"
          >
            <Package size={20} />
            <div>
              <b>{row.productName || "Product name pending"}</b>
              <small>{row.sku || "SKU pending"}</small>
            </div>
          </section>
        </div>
        <div className="composition-heading-actions">
          <div className="composition-heading-preview">
            <PackagingGallery
              row={row}
              disabled={Boolean(uploadingComponent) || !canEdit}
              importId={importId}
              onSaved={onPhotosSaved}
              onBusy={(busy) => {
                setUploading(busy);
                onBusy(busy);
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={uploading}
          >
            <ArrowLeft size={16} /> {backLabel}
          </Button>
          <Link
            className="gallery-analyse-link"
            href={`/dashboard/packaging/${importId}/${row.rowNumber}/analyse`}
            target="_self"
            onNavigate={() =>
              rememberPackagingWorkspace(importId, row.rowNumber)
            }
            aria-label="Analyse packaging"
          >
            <ChartNoAxesCombined size={16} /> Analyse
          </Link>
          <Button type="button" onClick={onEdit} disabled={uploading}>
            <Pencil size={16} /> Edit details
          </Button>
        </div>
      </header>
      <div className="composition-view-grid">
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
                  Upload component photos or analyse each packaging component.
                </p>
              </div>
              <span className="composition-view-total">
                {total.toFixed(2)} g
              </span>
            </div>
            {components.length ? (
              <div className="composition-compact-grid">
                {components.map((component, index) => (
                  <article
                    className="composition-component composition-saved-component"
                    key={component.id}
                  >
                    <div className="composition-component-number">
                      {index + 1}
                    </div>
                    <div className="composition-view-component-photo">
                      {canEdit ? (
                        <label
                          className={`component-photo-upload ${uploading ? "is-busy" : ""}`}
                        >
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/png,image/jpeg"
                            disabled={uploading}
                            aria-label={`Upload ${component.name || `component ${index + 1}`} photo`}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = "";
                              void uploadComponent(component.id, file);
                            }}
                          />
                          {component.image ? (
                            <img
                              src={image(component.image)}
                              alt={component.name || `Component ${index + 1}`}
                            />
                          ) : (
                            <Package size={28} aria-hidden="true" />
                          )}
                          <span className="component-photo-upload-action">
                            {uploadingComponent === component.id ? (
                              <LoaderCircle size={16} className="spin" />
                            ) : (
                              <Upload size={16} />
                            )}
                            <span>
                              {uploadingComponent === component.id
                                ? "Saving…"
                                : component.image
                                  ? "Replace"
                                  : "Upload"}
                            </span>
                          </span>
                        </label>
                      ) : component.image ? (
                        <img
                          src={image(component.image)}
                          alt={component.name || `Component ${index + 1}`}
                        />
                      ) : (
                        <Package size={28} />
                      )}
                    </div>
                    <div className="composition-component-fields">
                      <div className="component-view-heading">
                        <div className="component-view-title">
                          <h4>{component.name || `Component ${index + 1}`}</h4>
                          <p className="component-view-weight">
                            Weight:{" "}
                            {component.weight?.trim()
                              ? `${Number(component.weight).toFixed(2)} g`
                              : "—"}
                          </p>
                          {component.supplierName && (
                            <p className="component-view-supplier">
                              Supplier: {component.supplierName}
                            </p>
                          )}
                        </div>
                        <div className="component-view-actions">
                          <Link
                            className="gallery-analyse-link component-analyse-link"
                            href={`/dashboard/packaging/${importId}/${row.rowNumber}/analyse?component=${encodeURIComponent(component.id)}`}
                            target="_self"
                            onNavigate={() =>
                              rememberPackagingWorkspace(
                                importId,
                                row.rowNumber,
                              )
                            }
                            aria-label={`Analyse ${component.name || `component ${index + 1}`}`}
                          >
                            <ChartNoAxesCombined size={15} /> Analyse
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
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
          Component photos save automatically. Other details are available in
          edit mode.
        </span>
        <Button type="button" onClick={onEdit} disabled={uploading}>
          <Pencil size={16} /> Edit details
        </Button>
      </footer>
    </motion.div>
  );
}
