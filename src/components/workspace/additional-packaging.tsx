"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Package,
  Plus,
  Trash2,
  Upload,
  FileText,
  Info,
  Save,
  LoaderCircle,
  Check,
  Layers3,
} from "lucide-react";
import { toast } from "sonner";
import {
  additionalPackagingSchema,
  detailSummary,
  packagingDetails,
  type AdditionalKind,
  type AdditionalPackagingData,
  type DetailField,
} from "@/lib/additional-packaging";
import styles from "./additional-packaging.module.css";

const materials = [
  "Paperboard",
  "Paper",
  "Coated paperboard",
  "PET",
  "PE",
  "PP",
  "HDPE",
  "LDPE",
  "Glass",
  "Aluminium",
  "Steel",
  "Wood",
  "Other",
];
const blankComponent = () => ({
  id: crypto.randomUUID(),
  name: "",
  material: "",
  quantity: 1,
  weight: 0,
});
function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.step}>
      <div className={styles.stepTitle}>
        <span>{number}</span>
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

export default function AdditionalPackaging({
  kind,
  importId,
  rowNumber,
  productName,
  canEdit,
  onBusy,
}: {
  kind: AdditionalKind;
  importId: string;
  rowNumber: number;
  productName: string;
  canEdit: boolean;
  onBusy?: (busy: boolean) => void;
}) {
  const config = packagingDetails[kind];
  const [data, setData] = useState<AdditionalPackagingData>(() => ({
    kind,
    rowNumber,
    used: "yes",
    name: productName || "",
    fields: {},
    components: [blankComponent()],
    attachments: {},
  }));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const base = `/api/packaging-imports/${importId}/details/${kind}`;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    setError("");
    fetch(`${base}?rowNumber=${rowNumber}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error || "Could not load packaging details.");
        if (body) {
          const parsed = additionalPackagingSchema.parse(body);
          if (parsed.kind !== kind || parsed.rowNumber !== rowNumber)
            throw new Error("Packaging details do not match this row.");
          setData(parsed);
          setHasSaved(true);
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          setError(failure.message || "Could not load packaging details.");
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [base, rowNumber, kind, retry]);
  const locked =
    !canEdit || loading || saving || Boolean(uploading) || loadError;
  const inactive = locked || data.used !== "yes";
  const summary = detailSummary(data);
  function update(changes: Partial<AdditionalPackagingData>) {
    setData((current) => ({ ...current, ...changes }));
    setDirty(true);
    setError("");
  }
  function fieldChange(key: string, value: string | number) {
    update({ fields: { ...data.fields, [key]: value } });
  }
  function componentChange(
    id: string,
    changes: Partial<AdditionalPackagingData["components"][number]>,
  ) {
    update({
      components: data.components.map((item) =>
        item.id === id ? { ...item, ...changes } : item,
      ),
    });
  }
  function fields(definitions: DetailField[]) {
    return (
      <div className={styles.fields}>
        {definitions.map((field) => (
          <label key={field.key}>
            {field.label}
            {field.unit && <small> ({field.unit})</small>}
            {field.options ? (
              <select
                disabled={inactive}
                value={data.fields[field.key] ?? ""}
                onChange={(event) => fieldChange(field.key, event.target.value)}
              >
                <option value="">Select</option>
                {field.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || "text"}
                min={field.type === "number" ? 0 : undefined}
                step={
                  field.type === "number"
                    ? field.whole
                      ? 1
                      : "any"
                    : undefined
                }
                disabled={inactive}
                value={data.fields[field.key] ?? ""}
                onChange={(event) => {
                  if (field.type === "number" && event.target.value === "") {
                    const next = { ...data.fields };
                    delete next[field.key];
                    update({ fields: next });
                  } else
                    fieldChange(
                      field.key,
                      field.type === "number"
                        ? Number(event.target.value)
                        : event.target.value,
                    );
                }}
              />
            )}
          </label>
        ))}
      </div>
    );
  }
  const fileUrl = (id: string) =>
    `${base}/files?rowNumber=${rowNumber}&asset=${id}`;
  async function upload(slot: string, file: File) {
    if (
      !file.size ||
      file.size > 2 * 1024 * 1024 ||
      !["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(
        file.type,
      ) ||
      (slot === "photo" && !file.type.startsWith("image/"))
    ) {
      setError(
        "Choose an image or PDF up to 2 MB. Product photos must be images.",
      );
      return;
    }
    setUploading(slot);
    onBusy?.(true);
    setError("");
    try {
      const form = new FormData();
      form.set("rowNumber", String(rowNumber));
      form.set("slot", slot);
      form.set("file", file);
      const response = await fetch(`${base}/files`, {
        method: "POST",
        body: form,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Upload failed.");
      update({ attachments: { ...data.attachments, [slot]: body } });
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setUploading("");
      onBusy?.(false);
    }
  }
  function uploadControl(slot: string) {
    const attached = data.attachments[slot];
    return (
      <div className={styles.uploadSlot} key={slot}>
        {slot !== "photo" && <span>{slot}</span>}
        {attached && (
          <div className={styles.attached}>
            <FileText size={14} />
            <a href={fileUrl(attached.id)} target="_blank" rel="noreferrer">
              {attached.name}
            </a>
            {canEdit && (
              <button
                type="button"
                aria-label={`Remove ${slot}`}
                disabled={locked}
                onClick={() => {
                  const next = { ...data.attachments };
                  delete next[slot];
                  update({ attachments: next });
                }}
              >
                <XIcon />
              </button>
            )}
          </div>
        )}
        <label className={styles.uploadButton}>
          {uploading === slot ? (
            <LoaderCircle size={15} className="spin" />
          ) : (
            <Upload size={15} />
          )}
          {attached
            ? "Replace"
            : slot === "photo"
              ? "Upload photo"
              : "Upload file"}
          <input
            aria-label={`Upload ${slot}`}
            type="file"
            disabled={locked}
            accept={
              slot === "photo"
                ? "image/png,image/jpeg,image/webp"
                : "application/pdf,image/png,image/jpeg,image/webp"
            }
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void upload(slot, file);
            }}
          />
        </label>
      </div>
    );
  }
  async function save() {
    const parsed = additionalPackagingSchema.safeParse(data);
    if (!parsed.success) {
      setError(
        "Check values: use non-negative weights and whole-number quantities and counts.",
      );
      return;
    }
    setSaving(true);
    onBusy?.(true);
    setError("");
    try {
      const response = await fetch(base, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || "Could not save packaging details.");
      setData(additionalPackagingSchema.parse(body));
      setDirty(false);
      setHasSaved(true);
      toast.success(`${config.tab} details saved`);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setSaving(false);
      onBusy?.(false);
    }
  }
  const reuse = kind === "reuse";
  const composite = kind === "composite";
  const unitWeight = Number(data.fields.unitWeight || 0);
  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>PACKAGING WORKSPACE</span>
          <h2>{config.title}</h2>
          <p>
            Record the packaging configuration for{" "}
            <strong>{productName}</strong>.
          </p>
        </div>
        <span className={dirty ? styles.dirty : styles.saved}>
          {loading ? (
            "Loading…"
          ) : dirty ? (
            "Unsaved changes"
          ) : hasSaved ? (
            <>
              <Check size={13} /> Saved
            </>
          ) : (
            "Not saved yet"
          )}
        </span>
      </header>
      {error && (
        <div className={styles.error} role="alert">
          {error}
          {loadError && (
            <button
              type="button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Retry loading
            </button>
          )}
        </div>
      )}
      {!canEdit && (
        <p className={styles.readOnly}>
          You have view-only access to these details.
        </p>
      )}
      <div className={styles.grid}>
        <aside className={styles.photoCard}>
          <h3>Product photo</h3>
          <div className={styles.photo}>
            {data.attachments.photo ? (
              <img
                src={fileUrl(data.attachments.photo.id)}
                alt={`${config.tab} packaging`}
              />
            ) : (
              <>
                <Package size={60} strokeWidth={1} />
                <span>Add a packaging photo</span>
              </>
            )}
          </div>
          <label>
            Packaging name
            <input
              value={data.name}
              disabled={locked}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="Name this packaging unit"
            />
          </label>
          <p>{productName}</p>
          {uploadControl("photo")}
          <small>JPG, PNG or WEBP · Max 2 MB</small>
        </aside>
        <div className={styles.form}>
          <Step number={1} title={config.question}>
            <div className={styles.radios}>
              {(["yes", "no", "na"] as const).map((value) => (
                <label
                  key={value}
                  className={data.used === value ? styles.selected : ""}
                >
                  <input
                    type="radio"
                    name={`${kind}-${rowNumber}-used`}
                    checked={data.used === value}
                    disabled={locked}
                    onChange={() => update({ used: value })}
                  />
                  {value === "yes"
                    ? "Yes"
                    : value === "no"
                      ? "No"
                      : "Not applicable"}
                </label>
              ))}
            </div>
            {data.used !== "yes" && (
              <p className={styles.muted}>
                Details are retained for reference; this configuration is
                excluded from active weight totals.
              </p>
            )}
          </Step>
          <Step number={2} title={config.section}>
            {fields(config.fields)}
          </Step>
          <Step
            number={3}
            title={
              composite
                ? "Material composition"
                : reuse
                  ? "Packaging record"
                  : "Components"
            }
          >
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>{composite ? "Layer / material" : "Component"}</th>
                    <th>Material</th>
                    {!composite && (
                      <th>
                        {reuse
                          ? "Units in pool"
                          : kind === "service"
                            ? "Qty / serving"
                            : "Quantity"}
                      </th>
                    )}
                    <th>{composite ? "Weight (g)" : "Weight each (g)"}</th>
                    {composite && <th>Share</th>}
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.components.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          aria-label="Component name"
                          value={item.name}
                          disabled={inactive}
                          onChange={(event) =>
                            componentChange(item.id, {
                              name: event.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <select
                          aria-label="Component material"
                          value={item.material}
                          disabled={inactive}
                          onChange={(event) =>
                            componentChange(item.id, {
                              material: event.target.value,
                            })
                          }
                        >
                          <option value="">Select material</option>
                          {materials.map((material) => (
                            <option key={material}>{material}</option>
                          ))}
                        </select>
                      </td>
                      {!composite && (
                        <td>
                          <input
                            aria-label={reuse ? "Units in pool" : "Quantity"}
                            type="number"
                            min={0}
                            step={1}
                            value={item.quantity}
                            disabled={inactive}
                            onChange={(event) =>
                              componentChange(item.id, {
                                quantity: Number(event.target.value),
                              })
                            }
                          />
                        </td>
                      )}
                      <td>
                        <input
                          aria-label="Weight each (g)"
                          type="number"
                          min={0}
                          step="any"
                          value={item.weight}
                          disabled={inactive}
                          onChange={(event) =>
                            componentChange(item.id, {
                              weight: Number(event.target.value),
                            })
                          }
                        />
                      </td>
                      {composite && (
                        <td>
                          {(unitWeight || summary.materialWeight) > 0
                            ? `${((item.weight / (unitWeight || summary.materialWeight)) * 100).toFixed(1)}%`
                            : "—"}
                        </td>
                      )}
                      <td>
                        <button
                          aria-label="Remove component"
                          type="button"
                          disabled={inactive}
                          onClick={() =>
                            update({
                              components: data.components.filter(
                                (component) => component.id !== item.id,
                              ),
                            })
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.components.length && (
              <p className={styles.muted}>
                Add the materials or components used in this packaging.
              </p>
            )}
            <button
              className={styles.add}
              type="button"
              disabled={inactive || data.components.length >= 50}
              onClick={() =>
                update({ components: [...data.components, blankComponent()] })
              }
            >
              <Plus size={14} />
              {composite
                ? "Add material"
                : reuse
                  ? "Add packaging record"
                  : "Add component"}
            </button>
          </Step>
          <Step number={4} title={config.extraTitle}>
            {fields(config.extra)}
            {kind === "ecommerce" && (
              <div className={styles.volume}>
                <span>Internal volume</span>
                <b>{summary.volume.toLocaleString()} cm³</b>
              </div>
            )}
            {config.uploads.length > 0 && (
              <div className={styles.uploads}>
                {config.uploads.map(uploadControl)}
              </div>
            )}
          </Step>
        </div>
        <aside className={styles.summary}>
          <h3>
            <Layers3 size={18} /> Summary
          </h3>
          {kind === "ecommerce" || kind === "service" ? (
            <>
              <Summary
                label={
                  kind === "ecommerce"
                    ? "Packaging / order"
                    : "Packaging / serving"
                }
                value={`${summary.weight.toLocaleString()} g`}
              />
              <Summary
                label={kind === "ecommerce" ? "Orders" : "Servings"}
                value={String(
                  data.used === "yes"
                    ? data.fields[
                        kind === "ecommerce" ? "orders" : "servings"
                      ] || 0
                    : 0,
                )}
              />
              <Summary
                label={
                  kind === "ecommerce"
                    ? "Total shipping packaging"
                    : "Total service packaging"
                }
                value={`${summary.totalKg.toLocaleString()} kg`}
              />
            </>
          ) : reuse ? (
            <>
              <Summary
                label="Packaging stock"
                value={`${data.used === "yes" ? data.components.reduce((sum, item) => sum + item.quantity, 0).toLocaleString() : 0} units`}
              />
              <Summary
                label="Stock packaging mass"
                value={`${(summary.weight / 1000).toLocaleString()} kg`}
              />
              <Summary
                label="Recorded refills"
                value={String(
                  data.used === "yes" ? data.fields.refills || 0 : 0,
                )}
              />
            </>
          ) : composite ? (
            <>
              <Summary
                label="Total material weight"
                value={`${summary.materialWeight.toLocaleString()} g`}
              />
              <Summary
                label="Material shares"
                value={
                  unitWeight
                    ? `${((summary.materialWeight / unitWeight) * 100).toFixed(1)}%`
                    : summary.materialWeight
                      ? "100%"
                      : "—"
                }
              />
              <Summary label="Main material" value={summary.main} />
              <Summary label="Classification" value="Pending assessment" />
              {unitWeight > 0 &&
                Math.abs(summary.materialWeight - unitWeight) > 0.001 &&
                data.used === "yes" && (
                  <p className={styles.warning}>
                    Material weights do not match the declared total unit
                    weight.
                  </p>
                )}
            </>
          ) : (
            <>
              <Summary
                label="Container packaging"
                value={`${summary.weight.toLocaleString()} g`}
              />
              <Summary
                label="Destination market"
                value={String(data.fields.destination || "Not selected")}
              />
              <Summary
                label="Scheme status"
                value={
                  data.used !== "yes"
                    ? "Not assessed"
                    : String(data.fields.scheme || "Pending review")
                }
              />
            </>
          )}
          <div className={styles.note}>
            <Info size={16} />
            <span>{config.note}</span>
          </div>
          {canEdit && (
            <button
              className={styles.save}
              type="button"
              disabled={locked || !dirty}
              onClick={() => void save()}
            >
              {saving ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Saving…" : "Save details"}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function XIcon() {
  return <span aria-hidden="true">×</span>;
}
