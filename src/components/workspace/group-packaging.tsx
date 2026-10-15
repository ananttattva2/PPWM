"use client";
import { useEffect, useId, useState } from "react";
import { Modal } from "@mantine/core";
import { motion, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  Layers3,
  LoaderCircle,
  Maximize2,
  Package,
  Save,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { ImportResult } from "@/lib/packaging-import-schema";
import {
  groupCountKey,
  groupCountsPayload,
  groupPackagingSchema,
  MAX_GROUP_COUNT,
  type GroupCounts,
} from "@/lib/group-packaging";

export default function GroupPackaging({
  imported,
  canEdit,
  onBusy,
  initialRowNumber,
}: {
  initialRowNumber?: number;
  imported: ImportResult | null;
  canEdit: boolean;
  onBusy?: (busy: boolean) => void;
}) {
  const id = useId();
  const reduce = useReducedMotion();
  const [selectedRow, setSelectedRow] = useState<number | null>(
    initialRowNumber ?? null,
  );
  const [componentsOpen, setComponentsOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [counts, setCounts] = useState<GroupCounts>({});
  const [skuCounts, setSkuCounts] = useState<GroupCounts>({});
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(Boolean(imported?.id));
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [retry, setRetry] = useState(0);
  const importId = imported?.id;
  useEffect(() => {
    setCounts({});
    setSkuCounts({});
    setDirty(false);
    setLoadError("");
    setSaveError("");
    if (!importId) return;
    const controller = new AbortController();
    setLoading(true);
    async function load() {
      try {
        const response = await fetch(
          `/api/packaging-imports/${importId}/group-packaging`,
          { signal: controller.signal, cache: "no-store" },
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Could not load group counts.");
        const parsed = groupPackagingSchema.safeParse(data);
        if (!parsed.success)
          throw new Error(
            "Saved group counts could not be read. Please retry.",
          );
        const saved = parsed.data;
        const restored: GroupCounts = {};
        const restoredSkuCounts: GroupCounts = {};
        for (const group of saved.groups) {
          if (group.count !== undefined)
            restoredSkuCounts[String(group.rowNumber)] = String(group.count);
        }
        for (const group of saved.groups)
          for (const component of group.components)
            restored[groupCountKey(group.rowNumber, component.componentId)] =
              String(component.count);
        if (!controller.signal.aborted) {
          setCounts(restored);
          setSkuCounts(restoredSkuCounts);
        }
      } catch (failure) {
        if (!controller.signal.aborted)
          setLoadError(
            (failure as Error).message || "Could not load group counts.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [importId, retry]);
  const rows = imported?.analysis.rows || [];
  const row = rows.find((row) => row.rowNumber === selectedRow) || rows[0];
  const components = row?.composition?.components || [];
  const photo =
    row?.composition?.productImage || row?.composition?.productImages?.[0];
  const image = (assetId: string) =>
    `/api/packaging-imports/${importId}/assets/${assetId}`;
  const invalid = Object.values(skuCounts).some(
    (value) =>
      value.trim() !== "" &&
      (!Number.isInteger(Number(value)) ||
        Number(value) < 0 ||
        Number(value) > MAX_GROUP_COUNT),
  );
  const locked = !canEdit || loading || saving || Boolean(loadError);
  async function save() {
    if (!imported || locked || !dirty) return;
    const parsed = groupPackagingSchema.safeParse(
      groupCountsPayload(rows, counts, skuCounts),
    );
    if (!parsed.success) {
      setSaveError("Enter whole-number counts between 0 and 100,000.");
      return;
    }
    setSaving(true);
    setSaveError("");
    onBusy?.(true);
    try {
      const response = await fetch(
        `/api/packaging-imports/${imported.id}/group-packaging`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not save group counts.");
      setDirty(false);
      toast.success("Group packaging counts saved");
    } catch (failure) {
      setSaveError((failure as Error).message);
    } finally {
      setSaving(false);
      onBusy?.(false);
    }
  }
  if (!row)
    return (
      <section className="group-packaging-empty">
        <Layers3 size={40} />
        <h2>Build your group packaging</h2>
        <p>
          Add SKUs and their components in Sales Packaging to enter group counts
          here.
        </p>
      </section>
    );
  return (
    <div className="composition-builder group-packaging-workspace">
      <header className="group-packaging-heading">
        <div>
          <span className="composition-eyebrow">GROUP PACKAGING</span>
          <h2>Component count matrix</h2>
          <p>Enter the group count for each SKU and save your changes.</p>
        </div>
        <span
          className={`group-save-state ${dirty ? "unsaved" : ""}`}
          role="status"
        >
          {loading
            ? "Loading saved counts…"
            : loadError
              ? "Counts unavailable"
              : !canEdit
                ? "View only"
                : dirty
                  ? "Unsaved changes"
                  : "Saved counts up to date"}
        </span>
      </header>
      {loadError && (
        <div className="group-packaging-error" role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={() => setRetry((value) => value + 1)}>
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      )}
      <div className="group-packaging-grid">
        <section className="group-product-card composition-card">
          {rows.length > 1 && (
            <nav
              className="group-sku-navigation"
              aria-label="Group packaging products"
            >
              {rows.map((item) => (
                <button
                  key={item.rowNumber}
                  type="button"
                  aria-current={
                    row.rowNumber === item.rowNumber ? "true" : undefined
                  }
                  disabled={saving}
                  onClick={() => {
                    setSelectedRow(item.rowNumber);
                    setComponentsOpen(false);
                  }}
                >
                  {item.sku || `Row ${item.rowNumber}`}
                </button>
              ))}
            </nav>
          )}
          <div className="group-product-photo">
            {photo ? (
              <img
                src={image(photo)}
                alt={`${row.productName} product`}
                loading="lazy"
              />
            ) : (
              <div className="group-photo-placeholder">
                <Package size={42} />
                <span>No SKU photo yet</span>
              </div>
            )}
            {photo && (
              <button
                type="button"
                className="group-photo-expand"
                aria-label="Expand group SKU photo"
                onClick={() => setZoom(true)}
              >
                <Maximize2 size={17} />
              </button>
            )}
          </div>
          <div className="group-product-identity">
            <b>{row.productName || "Unnamed product"}</b>
            <span>{row.sku || `Row ${row.rowNumber}`}</span>
          </div>
          <button
            type="button"
            className="group-components-toggle"
            aria-expanded={componentsOpen}
            aria-controls={`${id}-components`}
            onClick={() => setComponentsOpen((value) => !value)}
          >
            <span>
              <Layers3 size={17} /> Components <b>{components.length}</b>
            </span>
            <ChevronDown size={18} />
          </button>
          <motion.div
            id={`${id}-components`}
            initial={false}
            animate={{
              height: componentsOpen ? "auto" : 0,
              opacity: componentsOpen ? 1 : 0,
            }}
            transition={{
              duration: reduce ? 0 : 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ overflow: "hidden" }}
            aria-hidden={!componentsOpen}
            inert={!componentsOpen}
          >
            <div className="group-component-list">
              {components.map((component, index) => (
                <button
                  type="button"
                  key={component.id}
                  disabled={locked}
                  aria-label={`View ${component.name || `component ${index + 1}`}`}
                  onClick={() =>
                    document.getElementById(`${id}-group-count`)?.focus()
                  }
                >
                  <span className="group-component-thumb">
                    {component.image ? (
                      <img src={image(component.image)} alt="" loading="lazy" />
                    ) : (
                      <Package size={22} />
                    )}
                  </span>
                  <span>
                    <b>{component.name || `Component ${index + 1}`}</b>
                    <small>
                      {component.material || "Material not provided"}
                    </small>
                  </span>
                  <span className="group-component-index">{index + 1}</span>
                </button>
              ))}
              {components.length === 0 && (
                <p>No saved components. Add them in Sales Packaging.</p>
              )}
            </div>
          </motion.div>
        </section>
        <section
          className="group-matrix-card composition-card"
          aria-label="Group component count matrix"
        >
          <div className="group-matrix-heading">
            <div>
              <h3>Counts per group</h3>
              <p>
                {row.productName} · {row.sku || `Row ${row.rowNumber}`}
              </p>
            </div>
            <span className="composition-count">
              {components.length} components
            </span>
          </div>
          <label className="group-count-field" htmlFor={`${id}-group-count`}>
            Group count
            <input
              id={`${id}-group-count`}
              aria-label="Group count"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_GROUP_COUNT}
              step={1}
              placeholder="0"
              value={skuCounts[String(row.rowNumber)] ?? ""}
              disabled={locked}
              aria-invalid={invalid || undefined}
              onChange={(event) => {
                const value = event.target.value;
                setSkuCounts((current) => ({
                  ...current,
                  [String(row.rowNumber)]: value,
                }));
                setDirty(true);
                setSaveError("");
              }}
            />
            <small>Number of groups for this SKU.</small>
          </label>
          {components.length ? (
            <div className="group-matrix-scroll">
              <table>
                <caption className="sr-only">
                  Component quantities per group for {row.productName}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Component</th>
                    <th scope="col">Weight each (g)</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((component, index) => {
                    const hasWeight = component.weight.trim() !== "";
                    return (
                      <tr key={component.id}>
                        <th scope="row">
                          <span className="group-matrix-component">
                            <span className="group-component-thumb">
                              {component.image ? (
                                <img
                                  src={image(component.image)}
                                  alt=""
                                  loading="lazy"
                                />
                              ) : (
                                <Package size={22} />
                              )}
                            </span>
                            <span>
                              <b>
                                {component.name || `Component ${index + 1}`}
                              </b>
                              <small>
                                {component.material || "Not provided"}
                              </small>
                            </span>
                          </span>
                        </th>
                        <td>
                          {hasWeight
                            ? Number(component.weight).toFixed(2)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="group-matrix-no-components">
              <Package size={32} />
              <p>
                Save component details for this SKU in Sales Packaging first.
              </p>
            </div>
          )}
          {(invalid || saveError) && (
            <p className="group-packaging-error" role="alert">
              {saveError ||
                "Counts must be whole numbers between 0 and 100,000."}
            </p>
          )}
          <footer className="group-matrix-footer">
            <span>
              Group counts for all SKUs save together. Enter 0 for unused SKUs.
            </span>
            {canEdit && (
              <button
                type="button"
                className="group-save-button"
                disabled={!dirty || locked || invalid}
                onClick={() => void save()}
              >
                {saving ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Saving…" : "Save group counts"}
              </button>
            )}
          </footer>
        </section>
      </div>
      <Modal
        opened={zoom}
        onClose={() => setZoom(false)}
        title={row.productName || "SKU photo"}
        centered
        size="lg"
      >
        {photo && (
          <img
            className="group-zoom-image"
            src={image(photo)}
            alt={`${row.productName} product`}
          />
        )}
      </Modal>
    </div>
  );
}
