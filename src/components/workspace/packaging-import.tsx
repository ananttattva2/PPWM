"use client";
import { useRef, useState } from "react";
import { Checkbox, RingProgress } from "@mantine/core";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CalendarDays,
  UserRound,
  HardDrive,
  Settings2,
  ArrowRight,
  X,
  Package,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  Layers3,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/button";
import { Select } from "../ui/floating-fields";
import {
  importCategories,
  importFields,
  type ImportResult,
  type ImportSettings,
  type ColumnMapping,
  MAX_IMPORT_SIZE,
} from "@/lib/packaging-import-schema";
const tabs = [
  "Data Preview",
  "Validation Issues",
  "Missing Fields",
  "Column Mapping",
] as const;
const defaultSettings: ImportSettings = {
  category: "All Categories",
  plant: "All Plants",
  firstRow: "headers",
  updateExisting: true,
};
export default function PackagingImport({
  result: parentResult,
  onChange,
  onBusy,
  sourceFile,
  onFileChange,
  organisationName,
}: {
  result: ImportResult | null;
  onChange: (result: ImportResult | null) => void;
  onBusy: (busy: boolean) => void;
  sourceFile: File | null;
  onFileChange: (file: File | null) => void;
  organisationName: string;
}) {
  const [result, setResult] = useState(parentResult);
  const [dirty, setDirty] = useState(false);
  const [file, setFile] = useState<File | null>(sourceFile),
    [settings, setSettings] = useState<ImportSettings>(
      result?.settings || defaultSettings,
    ),
    [mapping, setMapping] = useState<ColumnMapping>(result?.mapping || {}),
    [tab, setTab] = useState<(typeof tabs)[number]>("Data Preview"),
    [busy, setBusy] = useState(false),
    [drag, setDrag] = useState(false),
    [all, setAll] = useState(false);
  const input = useRef<HTMLInputElement>(null),
    id = useRef(result?.id || ""),
    savedFile = useRef<File | null>(null);
  function choose(next?: File) {
    if (busy) return;
    if (!next) return;
    if (
      !/\.(csv|xlsx)$/i.test(next.name) ||
      next.size === 0 ||
      next.size > MAX_IMPORT_SIZE
    ) {
      toast.error("Choose a CSV or XLSX file up to 2 MB.");
      return;
    }
    setFile(next);
    onFileChange(next);
    setResult(null);
    setDirty(false);
    savedFile.current = next;
    id.current = "";
    setMapping({});
    onChange(null);
    setTab("Data Preview");
    setAll(false);
  }
  function updateSettings(next: ImportSettings) {
    setSettings(next);
    setDirty(true);
    onChange(null);
  }
  async function process() {
    if (busy) return;
    const selected = file || savedFile.current;
    if (!selected) {
      toast.error("Choose a packaging file first.");
      return;
    }
    setBusy(true);
    onBusy(true);
    const notification = toast.loading(
      "Reading your file and validating packaging data…",
    );
    try {
      const body = new FormData();
      body.append("file", selected);
      body.append("settings", JSON.stringify(settings));
      if (Object.keys(mapping).length)
        body.append("mapping", JSON.stringify(mapping));
      if (id.current) body.append("importId", id.current);
      const response = await fetch("/api/packaging-imports", {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not process this file.");
      id.current = data.id;
      setMapping(data.mapping);
      setResult(data);
      setDirty(false);
      onChange(data);
      toast.success(
        data.analysis.summary.errors || data.analysis.summary.missing
          ? "File processed — review the issues below"
          : "File processed — all rows are ready",
        {
          id: notification,
          description: `${data.analysis.summary.total} rows analysed and saved securely.`,
        },
      );
    } catch (e) {
      toast.error((e as Error).message, { id: notification });
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  const summary = result?.analysis.summary || {
    total: 0,
    complete: 0,
    missing: 0,
    errors: 0,
    completeness: 0,
  };
  const selectedName = file?.name || result?.file.name;
  const size = file?.size || result?.file.size || 0;
  const rows = result?.analysis.rows || [];
  const visibleRows = all ? rows : rows.slice(0, 10);
  const percentage = (count: number) =>
    summary.total ? `${((count / summary.total) * 100).toFixed(1)}%` : "—";
  function template() {
    const text =
      "SKU,Product Name,Category,Packaging Type,Material,Total Weight (g),Components,Label Coverage (%),Adhesive Type,Barrier Layer Details,Printing / Ink Details\nSKU-001,Mineral Water 500ml,Beverages,Bottle,PET,23.5,3,80,Water-based,None,Low coverage\nSKU-002,Snack Pouch,Snacks,Pouch,Multi-layer (Plastic),6.8,4,60,Solvent-free,PE,Standard\n";
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "packaging-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="packaging-import-workspace">
      <div className="import-workspace-heading">
        <div>
          <h3>Packaging Data Import</h3>
          <p>
            Upload your file, map its columns and validate every SKU before
            onboarding.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={template}>
          <Download size={14} /> Download template
        </Button>
      </div>
      <div className="import-top-grid">
        <section className="import-panel upload-panel">
          <h4>
            <span>1.</span> Upload File
          </h4>
          <div
            className={`import-dropzone ${drag ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              choose(e.dataTransfer.files[0]);
            }}
          >
            <FileSpreadsheet size={38} />
            <button type="button" onClick={() => input.current?.click()}>
              Drag & drop your file here
              <br />
              or click to upload
            </button>
            <small>CSV or XLSX · Up to 2 MB · 1,000 rows</small>
            <input
              ref={input}
              type="file"
              aria-label="Packaging data file"
              className="sr-only"
              accept=".csv,.xlsx"
              onChange={(e) => {
                choose(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          {selectedName ? (
            <div className="import-selected-file">
              <FileSpreadsheet size={25} />
              <div>
                <b>{selectedName}</b>
                <small>{(size / 1024).toFixed(1)} KB</small>
              </div>
              <button
                aria-label="Remove packaging file"
                type="button"
                disabled={busy}
                onClick={() => {
                  setFile(null);
                  onFileChange(null);
                  setResult(null);
                  savedFile.current = null;
                  onChange(null);
                  setMapping({});
                  id.current = "";
                }}
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="import-upload-hint">
              <UploadCloud size={14} /> Your data stays within this workspace.
            </div>
          )}
        </section>
        <section className="import-panel file-information">
          <h4>File Information</h4>
          <dl>
            {[
              [FileText, "File Name", selectedName || "No file selected"],
              [
                FileSpreadsheet,
                "File Type",
                selectedName?.toLowerCase().endsWith(".xlsx")
                  ? "Excel (.xlsx)"
                  : selectedName
                    ? "CSV (.csv)"
                    : "—",
              ],
              [
                HardDrive,
                "File Size",
                size ? `${(size / 1024).toFixed(1)} KB` : "—",
              ],
              [
                UserRound,
                "Uploaded By",
                result?.file.uploadedBy || "Recorded when processed",
              ],
              [
                CalendarDays,
                "Upload Date",
                result
                  ? new Date(result.file.uploadedAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Recorded when processed",
              ],
            ].map(([Icon, label, value]) => {
              const I = Icon as typeof FileText;
              return (
                <div key={label as string}>
                  <I size={14} />
                  <dt>{label as string}</dt>
                  <dd title={value as string}>{value as string}</dd>
                </div>
              );
            })}
          </dl>
        </section>
        <section className="import-panel import-settings">
          <h4>
            <Settings2 size={13} /> Import Settings
          </h4>
          <div className="import-settings-fields">
            <Select
              label="Product category"
              disabled={busy}
              data={["All Categories", ...importCategories]}
              value={settings.category}
              onChange={(value) =>
                updateSettings({
                  ...settings,
                  category:
                    (value as ImportSettings["category"]) || "All Categories",
                })
              }
            />
            <Select
              label="Plant / entity"
              disabled={busy}
              data={["All Plants", organisationName]}
              value={settings.plant}
              onChange={(value) =>
                updateSettings({ ...settings, plant: value || "All Plants" })
              }
            />
            <Select
              label="First row contains"
              disabled={busy}
              data={[
                { value: "headers", label: "Column Headers" },
                { value: "data", label: "Data (no headers)" },
              ]}
              value={settings.firstRow}
              onChange={(value) => {
                setMapping({});
                updateSettings({
                  ...settings,
                  firstRow: (value as "headers" | "data") || "headers",
                });
              }}
            />
          </div>
          <Checkbox
            disabled={busy}
            label="Update existing SKUs if already present"
            color="orange"
            checked={settings.updateExisting}
            onChange={(e) =>
              updateSettings({
                ...settings,
                updateExisting: e.currentTarget.checked,
              })
            }
          />
          <Button
            type="button"
            disabled={busy || !file}
            onClick={() => void process()}
          >
            {busy ? (
              <RefreshCw size={14} className="spin" />
            ) : (
              <>
                Process File <ArrowRight size={15} />
              </>
            )}
          </Button>
        </section>
      </div>
      {dirty && (
        <div className="import-dirty-note">
          <RefreshCw size={14} /> Settings or mapping changed. Click Process
          File to refresh and save your results.
        </div>
      )}
      <div className="import-summary-grid">
        <section className="import-panel import-summary">
          <h4>Import Summary</h4>
          <div>
            {[
              [Package, "Total SKUs Detected", summary.total, "mint"],
              [CheckCircle2, "Ready for Assessment", summary.complete, "green"],
              [AlertCircle, "Incomplete Data", summary.missing, "amber"],
              [AlertTriangle, "Validation Errors", summary.errors, "red"],
            ].map(([Icon, label, count, tone]) => {
              const I = Icon as typeof FileText;
              return (
                <motion.div
                  className={`import-stat ${tone}`}
                  key={label as string}
                  animate={{ opacity: 1, scale: 1 }}
                  initial={{ opacity: 0.7, scale: 0.98 }}
                >
                  <I size={24} />
                  <div>
                    <small>{label as string}</small>
                    <b>{count as number}</b>
                    <em>
                      {label === "Total SKUs Detected"
                        ? "Uploaded rows"
                        : percentage(count as number)}
                    </em>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
        <section className="import-panel completeness-panel">
          <h4>Data Completeness</h4>
          <div className="completeness-body">
            <RingProgress
              size={94}
              thickness={9}
              sections={
                summary.total
                  ? [
                      {
                        value: (summary.complete / summary.total) * 100,
                        color: "green",
                      },
                      {
                        value: (summary.missing / summary.total) * 100,
                        color: "orange",
                      },
                      {
                        value: (summary.errors / summary.total) * 100,
                        color: "red",
                      },
                    ]
                  : []
              }
              label={<b>{summary.completeness}%</b>}
            />
            <ul>
              {[
                ["Complete", summary.complete, "green"],
                ["Incomplete", summary.missing, "amber"],
                ["Errors", summary.errors, "red"],
              ].map(([label, count, tone]) => (
                <li key={label as string}>
                  <i className={tone as string} />
                  {label as string}
                  <b>{count as number}</b>
                </li>
              ))}
            </ul>
          </div>
          <p>Based on required packaging fields in this file.</p>
        </section>
        <section className="import-panel import-next-steps">
          <h4>Next Steps</h4>
          {[
            "Map required columns",
            "Review missing fields",
            "Fix validation errors",
            "Confirm and create SKUs",
          ].map((label, index) => (
            <button
              type="button"
              key={label}
              onClick={() =>
                setTab(
                  index === 0
                    ? "Column Mapping"
                    : index === 1
                      ? "Missing Fields"
                      : index === 2
                        ? "Validation Issues"
                        : "Data Preview",
                )
              }
            >
              <span>{index + 1}</span>
              {label}
            </button>
          ))}
        </section>
      </div>
      <div className="import-bottom-grid">
        <section className="import-panel import-data-panel">
          <div
            className="import-tabs"
            role="tablist"
            aria-label="Import results"
          >
            {tabs.map((name) => (
              <button
                role="tab"
                type="button"
                key={name}
                aria-selected={tab === name}
                aria-controls={`import-tab-${name.replaceAll(" ", "-")}`}
                onClick={() => setTab(name)}
              >
                {tab === name && (
                  <motion.span
                    layoutId="import-active-tab"
                    className="import-tab-indicator"
                    transition={{ duration: 0.2 }}
                  />
                )}
                {name}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              role="tabpanel"
              id={`import-tab-${tab.replaceAll(" ", "-")}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {!result ? (
                <div className="import-empty">
                  <Layers3 size={30} />
                  <h4>Your packaging data will appear here.</h4>
                  <p>
                    Upload a file and click Process File to see real counts,
                    validation results and a preview.
                  </p>
                </div>
              ) : tab === "Data Preview" ? (
                <>
                  <div className="preview-caption">
                    <b>Preview of detected data</b>
                    <span>
                      {all
                        ? `Showing ${rows.length} rows`
                        : "Showing first 10 rows"}
                    </span>
                    {rows.length > 10 && (
                      <button type="button" onClick={() => setAll(!all)}>
                        {all ? "Show less" : "View all"}
                      </button>
                    )}
                  </div>
                  <div className="table-scroll import-preview-table">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Product Name / SKU</th>
                          <th>Category</th>
                          <th>Packaging Type</th>
                          <th>Material</th>
                          <th>Weight (g)</th>
                          <th>Components</th>
                          <th>Data Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRows.map((row, index) => (
                          <tr key={row.rowNumber}>
                            <td>{index + 1}</td>
                            <td>
                              <b>{row.productName || "—"}</b>
                              <small>{row.sku || "Missing SKU"}</small>
                            </td>
                            <td>{row.category || "—"}</td>
                            <td>{row.packagingType || "—"}</td>
                            <td>{row.material || "—"}</td>
                            <td>{row.weight ?? "—"}</td>
                            <td>{row.components ?? "—"}</td>
                            <td>
                              <span
                                className={`import-row-status ${row.status}`}
                              >
                                {row.status === "complete"
                                  ? "Complete"
                                  : row.status === "missing"
                                    ? "Missing Data"
                                    : "Validation Error"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : tab === "Column Mapping" ? (
                <div className="mapping-panel">
                  <p>
                    Match each field to a source column. Reprocess the file
                    after changing a mapping.
                  </p>
                  <div>
                    {importFields.map((field) => (
                      <Select
                        key={field.key}
                        disabled={busy}
                        label={field.label}
                        required={field.required}
                        data={[
                          { value: "", label: "Not mapped" },
                          ...result.headers.map((h) => ({
                            value: h,
                            label: h,
                          })),
                        ]}
                        value={mapping[field.key] || ""}
                        onChange={(value) => {
                          setMapping((previous) => ({
                            ...previous,
                            [field.key]: value || "",
                          }));
                          setDirty(true);
                          onChange(null);
                        }}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => void process()}
                  >
                    Reprocess with mapping <RefreshCw size={14} />
                  </Button>
                </div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>SKU</th>
                        <th>Field</th>
                        <th>
                          {tab === "Missing Fields"
                            ? "Missing information"
                            : "Validation issue"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.analysis.issues
                        .filter(
                          (issue) =>
                            issue.kind ===
                            (tab === "Missing Fields" ? "missing" : "error"),
                        )
                        .map((issue, index) => (
                          <tr key={index}>
                            <td>{issue.row}</td>
                            <td>{issue.sku || "—"}</td>
                            <td>{issue.field}</td>
                            <td>{issue.message}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {!result.analysis.issues.some(
                    (issue) =>
                      issue.kind ===
                      (tab === "Missing Fields" ? "missing" : "error"),
                  ) && (
                    <div className="import-clear">
                      <CheckCircle2 size={23} /> No{" "}
                      {tab === "Missing Fields"
                        ? "missing fields"
                        : "validation errors"}{" "}
                      found.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
        <aside className="import-issue-side">
          <section className="import-panel">
            <h4>
              Missing Fields{" "}
              <span>
                (
                {result?.analysis.missingFields.reduce(
                  (sum, f) => sum + f.count,
                  0,
                ) || 0}
                )
              </span>
              <button type="button" onClick={() => setTab("Missing Fields")}>
                View all
              </button>
            </h4>
            {result?.analysis.missingFields.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Field Name</th>
                    <th>Rows</th>
                    <th>Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {result.analysis.missingFields.map((field) => (
                    <tr key={field.field}>
                      <td>{field.field}</td>
                      <td>{field.count}</td>
                      <td>{field.impact}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No missing fields detected{result ? "." : " yet."}</p>
            )}
          </section>
          <section className="import-panel">
            <h4>
              Validation Errors <span>({summary.errors})</span>
              <button type="button" onClick={() => setTab("Validation Issues")}>
                View all
              </button>
            </h4>
            {result?.analysis.validationErrors.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Error Type</th>
                    <th>Rows</th>
                  </tr>
                </thead>
                <tbody>
                  {result.analysis.validationErrors.map((error, index) => (
                    <tr key={index}>
                      <td>{error.message}</td>
                      <td>{error.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>
                {result
                  ? "All supplied values passed validation."
                  : "Process a file to validate its data."}
              </p>
            )}
          </section>
          <div className="import-save-note">
            <CheckCircle2 size={16} />
            <p>
              {result
                ? "Processed file, settings and validation results are saved. Click Next when all rows are complete."
                : "Your file and results will be saved when you process the import."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
