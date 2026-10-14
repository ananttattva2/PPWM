"use client";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@mantine/core";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  UploadCloud,
  Package,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ImagePlus,
  X,
  Layers3,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  importFields,
  importCategories,
  type ImportResult,
  type PackagingRow,
  type ImportField,
} from "@/lib/packaging-import-schema";
import {
  initialComposition,
  rowFields,
  type CompositionComponent,
} from "@/lib/packaging-composition";

const colours = ["#21a675", "#5685ee", "#f7ae28", "#c67ee6", "#e57386"];
export default function PackagingComposition({
  row,
  imported,
  onBack,
  onSave,
  onBusy,
  creating = false,
}: {
  row: PackagingRow;
  imported: ImportResult;
  onBack: () => void;
  onSave: (result: ImportResult) => void;
  onBusy: (busy: boolean) => void;
  creating?: boolean;
}) {
  const [fields, setFields] = useState(() => rowFields(row));
  const [composition, setComposition] = useState(() => initialComposition(row));
  const [images, setImages] = useState<Record<string, File>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [confirmBack, setConfirmBack] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    top.current?.scrollIntoView({ behavior: "instant", block: "start" });
    top.current?.focus();
  }, []);
  useEffect(() => {
    const urls = Object.fromEntries(
      Object.entries(images).map(([key, file]) => [
        key,
        URL.createObjectURL(file),
      ]),
    );
    setPreviews(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [images]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function field(key: ImportField, value: string) {
    setFields((previous) => ({ ...previous, [key]: value }));
    setDirty(true);
  }
  function component(
    id: string,
    key: keyof CompositionComponent,
    value: string,
  ) {
    setComposition((previous) => ({
      ...previous,
      components: previous.components.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
    setDirty(true);
  }
  function upload(key: string, file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg"].includes(file.type) ||
      !file.size ||
      file.size > 2 * 1024 * 1024
    ) {
      toast.error("Choose a PNG or JPEG image up to 2 MB.");
      return;
    }
    if (!images[key] && Object.keys(images).length >= 6) {
      toast.error("Save these images before uploading more (6 per save).");
      return;
    }
    setImages((previous) => ({ ...previous, [key]: file }));
    setDirty(true);
  }
  const asset = (id: string) =>
    `/api/packaging-imports/${imported.id}/assets/${id}`;
  function imageUpload(key: string, saved: string, label: string) {
    const src = previews[key] || (saved ? asset(saved) : "");
    return (
      <div
        className={`composition-image ${key === "product" ? "product" : ""}`}
      >
        <label>
          {src ? (
            <img src={src} alt={label} />
          ) : (
            <>
              <ImagePlus size={key === "product" ? 36 : 22} />
              <span>
                {key === "product" ? "Upload product photo" : "Add photo"}
              </span>
            </>
          )}
          <input
            type="file"
            aria-label={label}
            accept="image/png,image/jpeg"
            disabled={busy}
            onChange={(event) => {
              upload(key, event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          {src && (
            <span className="composition-image-replace">
              <UploadCloud size={13} /> Replace image
            </span>
          )}
        </label>
        {src && (
          <button
            type="button"
            aria-label={`Remove ${label}`}
            disabled={busy}
            onClick={() => {
              setImages((previous) => {
                const next = { ...previous };
                delete next[key];
                return next;
              });
              if (key === "product")
                setComposition((previous) => ({
                  ...previous,
                  productImage: "",
                }));
              else component(key, "image", "");
              setDirty(true);
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>
    );
  }
  function addComponent() {
    setComposition((previous) => ({
      ...previous,
      components: [
        ...previous.components,
        {
          id: crypto.randomUUID(),
          name: "",
          material: "",
          colour: "",
          weight: "",
          labelCoverage: "",
          adhesiveType: "",
          barrierLayer: "",
          printingInk: "",
          image: "",
        },
      ],
    }));
    setDirty(true);
  }
  const total = composition.components.reduce(
    (sum, item) => sum + (Number(item.weight) || 0),
    0,
  );
  const expected = Number(fields.weight) || 0;
  const completeWeights =
    composition.components.length > 0 &&
    composition.components.every(
      (item) => item.weight !== "" && Number(item.weight) > 0,
    );
  const matches =
    completeWeights && expected > 0 && Math.abs(total - expected) < 0.01;
  async function save() {
    if (busy) return;
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      const data = new FormData();
      data.append(
        "data",
        JSON.stringify({ rowNumber: row.rowNumber, fields, composition }),
      );
      for (const [key, image] of Object.entries(images))
        data.append(`image:${key}`, image);
      const response = await fetch(`/api/packaging-imports/${imported.id}`, {
        method: creating ? "POST" : "PATCH",
        body: data,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not save packaging details.");
      setDirty(false);
      toast.success(
        creating
          ? "SKU added successfully"
          : "Packaging details and images saved",
        {
          description: "SKU validation and totals have been refreshed.",
        },
      );
      onSave(result);
    } catch (failure) {
      setError((failure as Error).message);
      toast.error((failure as Error).message);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <motion.div
      ref={top}
      tabIndex={-1}
      className="composition-builder"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <header className="composition-heading">
        <div>
          <span className="composition-eyebrow">
            PACKAGING WORKSPACE / {fields.sku || "NEW SKU"}
          </span>
          <h2>
            {creating ? "Add packaging SKU" : "Packaging Composition Builder"}
          </h2>
          <p>
            Define every component. Add photos, materials and weights at your
            own pace.
          </p>
        </div>
        <div className="composition-heading-actions">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => (dirty ? setConfirmBack(true) : onBack())}
          >
            <ArrowLeft size={16} /> Back to list
          </Button>
          <Button type="button" disabled={busy} onClick={() => void save()}>
            {busy ? (
              <>
                <LoaderCircle size={16} className="spin" /> Saving…
              </>
            ) : (
              <>
                {creating ? "Save SKU" : "Save & continue"}{" "}
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </div>
      </header>
      <div className="composition-step-strip">
        <span>
          <CheckCircle2 size={18} /> File imported
        </span>
        <i />
        <span>
          <CheckCircle2 size={18} /> Columns mapped
        </span>
        <i />
        <span className="active">
          <Layers3 size={18} /> Packaging composition
        </span>
        <small>{dirty ? "Unsaved changes" : "Edit SKU details"}</small>
      </div>
      <div className="composition-grid">
        <aside className="composition-left">
          <section className="composition-card">
            <div className="composition-card-title">
              <h3>SKU information</h3>
              <span className={`import-row-status ${row.status}`}>
                {row.status === "complete"
                  ? "Complete"
                  : row.status === "missing"
                    ? "Missing data"
                    : "Needs correction"}
              </span>
            </div>
            <div className="composition-sku-title">
              <Package size={22} />
              <div>
                <b>{fields.productName || "Untitled product"}</b>
                <small>{fields.sku || "Add a SKU below"}</small>
              </div>
            </div>
            <div className="composition-field-grid">
              {importFields
                .filter(
                  (item) =>
                    ![
                      "labelCoverage",
                      "adhesiveType",
                      "barrierLayer",
                      "componentWeight",
                      "printingInk",
                    ].includes(item.key),
                )
                .map((item) => (
                  <label key={item.key}>
                    {item.label}
                    {item.required && <span> *</span>}
                    {item.key === "category" ? (
                      <select
                        aria-label={item.label}
                        disabled={busy}
                        value={fields[item.key]}
                        onChange={(event) =>
                          field(item.key, event.target.value)
                        }
                      >
                        <option value="">Select category</option>
                        {importCategories.map((category) => (
                          <option key={category}>{category}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        aria-label={item.label}
                        disabled={busy}
                        maxLength={200}
                        inputMode={
                          ["weight", "components"].includes(item.key)
                            ? "decimal"
                            : "text"
                        }
                        value={fields[item.key]}
                        onChange={(event) =>
                          field(item.key, event.target.value)
                        }
                      />
                    )}
                  </label>
                ))}
            </div>
            <label className="composition-field">
              Brand
              <input
                aria-label="Brand"
                disabled={busy}
                maxLength={200}
                value={composition.brand}
                onChange={(event) => {
                  setComposition({ ...composition, brand: event.target.value });
                  setDirty(true);
                }}
              />
            </label>
            <label className="composition-field">
              Product volume
              <input
                aria-label="Product volume"
                disabled={busy}
                maxLength={200}
                placeholder="e.g. 500 ml"
                value={composition.netContent}
                onChange={(event) => {
                  setComposition({
                    ...composition,
                    netContent: event.target.value,
                  });
                  setDirty(true);
                }}
              />
            </label>
          </section>
          <section className="composition-card">
            <h3>Product preview</h3>
            {imageUpload("product", composition.productImage, "Product photo")}
            <p className="composition-help">
              PNG or JPEG · Up to 2 MB. Use a clear photo of the complete pack.
            </p>
          </section>
        </aside>
        <section
          className="composition-middle"
          aria-label="Packaging component editor"
        >
          <section className="composition-card">
            <div className="composition-card-title">
              <div>
                <h3>
                  Packaging components{" "}
                  <span className="composition-count">
                    {composition.components.length}
                  </span>
                </h3>
                <p>Add the bottle, cap, label and other parts separately.</p>
              </div>
              <Button
                type="button"
                disabled={busy || composition.components.length >= 30}
                onClick={addComponent}
              >
                <Plus size={16} /> Add component
              </Button>
            </div>
            <AnimatePresence initial={false}>
              {composition.components.map((item, index) => (
                <motion.article
                  layout={!reducedMotion}
                  key={item.id}
                  className="composition-component"
                  initial={{ opacity: 0, y: reducedMotion ? 0 : 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="composition-component-number"
                    style={{ background: colours[index % colours.length] }}
                  >
                    {index + 1}
                  </div>
                  {imageUpload(
                    item.id,
                    item.image,
                    `Component ${index + 1} photo`,
                  )}
                  <div className="composition-component-fields">
                    <div className="composition-component-heading">
                      <input
                        aria-label={`Component ${index + 1} name`}
                        placeholder="Component name (e.g. Cap)"
                        maxLength={200}
                        disabled={busy}
                        value={item.name}
                        onChange={(event) =>
                          component(item.id, "name", event.target.value)
                        }
                      />
                      <button
                        type="button"
                        aria-label={`Delete component ${index + 1}`}
                        disabled={busy}
                        onClick={() => {
                          setComposition((previous) => ({
                            ...previous,
                            components: previous.components.filter(
                              (entry) => entry.id !== item.id,
                            ),
                          }));
                          setImages((previous) => {
                            const next = { ...previous };
                            delete next[item.id];
                            return next;
                          });
                          setDirty(true);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="composition-component-grid">
                      <label>
                        Material
                        <input
                          aria-label={`Component ${index + 1} material`}
                          disabled={busy}
                          maxLength={200}
                          placeholder="e.g. PET"
                          value={item.material}
                          onChange={(event) =>
                            component(item.id, "material", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Colour
                        <input
                          aria-label={`Component ${index + 1} colour`}
                          disabled={busy}
                          maxLength={200}
                          placeholder="e.g. Transparent"
                          value={item.colour}
                          onChange={(event) =>
                            component(item.id, "colour", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Weight (g)
                        <input
                          aria-label={`Component ${index + 1} weight`}
                          disabled={busy}
                          type="number"
                          min="0"
                          step="any"
                          value={item.weight}
                          onChange={(event) =>
                            component(item.id, "weight", event.target.value)
                          }
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="composition-more"
                      aria-expanded={expanded.includes(item.id)}
                      onClick={() =>
                        setExpanded((previous) =>
                          previous.includes(item.id)
                            ? previous.filter((id) => id !== item.id)
                            : [...previous, item.id],
                        )
                      }
                    >
                      {expanded.includes(item.id) ? "− Hide" : "+ Add"} label,
                      adhesive & barrier details
                    </button>
                    <AnimatePresence>
                      {expanded.includes(item.id) && (
                        <motion.div
                          className="composition-detail-grid"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: reducedMotion ? 0 : 0.2 }}
                        >
                          {(
                            [
                              ["labelCoverage", "Label coverage (%)"],
                              ["adhesiveType", "Adhesive type"],
                              ["barrierLayer", "Barrier layer details"],
                              ["printingInk", "Printing / ink details"],
                            ] as const
                          ).map(([key, label]) => (
                            <label key={key}>
                              {label}
                              <input
                                aria-label={`Component ${index + 1} ${label.toLowerCase()}`}
                                disabled={busy}
                                maxLength={200}
                                value={item[key]}
                                onChange={(event) =>
                                  component(item.id, key, event.target.value)
                                }
                              />
                            </label>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
            <button
              type="button"
              className="composition-add"
              disabled={busy || composition.components.length >= 30}
              onClick={addComponent}
            >
              <Plus size={22} />
              <b>Add another component</b>
              <span>
                Include liners, seals, closures or secondary packaging.
              </span>
            </button>
          </section>
          <section className="composition-card">
            <h3>Imported packaging details</h3>
            <p className="composition-help">
              These values update the import table. Component-specific details
              stay with each component.
            </p>
            <div className="composition-detail-grid">
              {importFields
                .filter((item) =>
                  [
                    "labelCoverage",
                    "adhesiveType",
                    "barrierLayer",
                    "componentWeight",
                    "printingInk",
                  ].includes(item.key),
                )
                .map((item) => (
                  <label key={item.key}>
                    {item.label}
                    <input
                      aria-label={item.label}
                      disabled={busy}
                      maxLength={200}
                      value={fields[item.key]}
                      onChange={(event) => field(item.key, event.target.value)}
                    />
                  </label>
                ))}
            </div>
          </section>
        </section>
        <aside className="composition-right">
          <section className="composition-card">
            <h3>Packaging preview</h3>
            <p className="composition-help">
              Your component photos and material breakdown.
            </p>
            <div className="composition-exploded">
              {composition.components.length ? (
                composition.components.map((item, index) => (
                  <div key={item.id}>
                    <span className="composition-preview-image">
                      {previews[item.id] || item.image ? (
                        <img
                          src={previews[item.id] || asset(item.image)}
                          alt={item.name || `Component ${index + 1}`}
                        />
                      ) : (
                        <Package
                          size={28}
                          style={{ color: colours[index % colours.length] }}
                        />
                      )}
                    </span>
                    <i
                      style={{ borderColor: colours[index % colours.length] }}
                    />
                    <div>
                      <b>{item.name || `Component ${index + 1}`}</b>
                      <small>{item.material || "Material pending"}</small>
                      <span>
                        {item.weight || "—"} g{" "}
                        {total > 0 && item.weight
                          ? `(${((Number(item.weight) / total) * 100).toFixed(1)}%)`
                          : ""}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p>Add components to build your preview.</p>
              )}
            </div>
          </section>
          <section className="composition-card">
            <h3>Total packaging weight</h3>
            <div className="composition-weight">
              <b>
                {total.toFixed(2)} <small>g</small>
              </b>
              <span className={matches ? "match" : "pending"}>
                {matches ? "Matches" : "In progress"}
              </span>
            </div>
            <p className="composition-help">
              Imported total: {fields.weight || "—"} g<br />
              Difference: {Math.abs(total - expected).toFixed(2)} g
            </p>
            <h4>Weight distribution</h4>
            <div className="composition-weight-bar">
              {composition.components.map((item, index) => (
                <motion.span
                  key={item.id}
                  initial={false}
                  animate={{
                    width: `${total ? (Number(item.weight) / total) * 100 : 0}%`,
                  }}
                  style={{ background: colours[index % colours.length] }}
                />
              ))}
            </div>
            {composition.components.map((item, index) => (
              <div className="composition-weight-legend" key={item.id}>
                <i style={{ background: colours[index % colours.length] }} />
                <span>{item.name || `Component ${index + 1}`}</span>
                <b>{item.weight || "—"} g</b>
              </div>
            ))}
          </section>
          <section className="composition-card composition-validation">
            <h3>Validation</h3>
            {[
              [matches, "Component weights match the imported total"],
              [
                composition.components.length === Number(fields.components),
                "Component count matches imported data",
              ],
              [
                composition.components.every(
                  (item) =>
                    item.name && item.material && Number(item.weight) > 0,
                ) && composition.components.length > 0,
                "Component names, materials and weights added",
              ],
              [
                Boolean(fields.labelCoverage) &&
                  Number(fields.labelCoverage) >= 0 &&
                  Number(fields.labelCoverage) <= 100,
                "Label coverage is within range",
              ],
            ].map(([valid, label]) => (
              <p key={String(label)} className={valid ? "valid" : "pending"}>
                {valid ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {label}
              </p>
            ))}
            <small>
              You can save incomplete details and finish them later.
            </small>
          </section>
        </aside>
      </div>
      <footer className="composition-footer">
        <span>
          {dirty ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {dirty
            ? "Unsaved changes — save before leaving"
            : "Your imported data is preserved"}
        </span>
        <Button type="button" disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : creating ? "Save SKU" : "Save & continue"}
          <ArrowRight size={16} />
        </Button>
      </footer>
      {error && (
        <p className="composition-error" role="alert">
          {error}
        </p>
      )}
      <Modal
        opened={confirmBack}
        onClose={() => setConfirmBack(false)}
        title="Leave without saving?"
        centered
        zIndex={300}
      >
        <div className="composition-discard-content">
          <p>Your latest edits and selected images have not been saved.</p>
          <Button
            autoFocus
            type="button"
            variant="outline"
            onClick={() => setConfirmBack(false)}
          >
            Keep editing
          </Button>
          <Button type="button" onClick={onBack}>
            Discard changes
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
