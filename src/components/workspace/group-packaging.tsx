"use client";
import { useEffect, useId, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Modal } from "@mantine/core";
import { Calculator, ChevronDown, Info, Layers3, LoaderCircle, Maximize2, Package, Plus, RefreshCw, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import type { ImportResult } from "@/lib/packaging-import-schema";
import { groupCountKey, groupCountsPayload, groupPackagingSchema, groupTotals, MAX_GROUP_COUNT, skuGroupTotal, type GroupCounts } from "@/lib/group-packaging";

export default function GroupPackaging({ imported, canEdit, onBusy, initialRowNumber }: {
  initialRowNumber?: number;
  imported: ImportResult | null;
  canEdit: boolean;
  onBusy?: (busy: boolean) => void;
}) {
  const id = useId();
  const [counts, setCounts] = useState<GroupCounts>({});
  const [skuCounts, setSkuCounts] = useState<GroupCounts>({});
  const [skuUnits, setSkuUnits] = useState<GroupCounts>({});
  const [groupNames, setGroupNames] = useState<GroupCounts>({});
  const [groupEnabled, setGroupEnabled] = useState<Record<string, boolean>>({});
  const [localPhoto, setLocalPhoto] = useState("");
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(Boolean(imported?.id));
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [retry, setRetry] = useState(0);
  const importId = imported?.id;
  const rows = imported?.analysis.rows || [];
  const row = rows.find((item) => item.rowNumber === initialRowNumber) || rows[0];
  const rowKey = String(row?.rowNumber || "");
  const components = row?.composition?.components || [];
  const savedPhoto = row?.composition?.productImage || row?.composition?.productImages?.[0];
  const image = (assetId: string) => `/api/packaging-imports/${importId}/assets/${assetId}`;
  const photo = localPhoto || (savedPhoto ? image(savedPhoto) : "");

  useEffect(() => {
    setCounts({}); setSkuCounts({}); setSkuUnits({}); setGroupNames({}); setGroupEnabled({});
    setDirty(false); setLoadError(""); setSaveError("");
    if (!importId) return;
    const controller = new AbortController();
    setLoading(true);
    async function load() {
      try {
        const response = await fetch(`/api/packaging-imports/${importId}/group-packaging`, { signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load grouped packaging.");
        const parsed = groupPackagingSchema.safeParse(data);
        if (!parsed.success) throw new Error("Saved grouped packaging could not be read.");
        const restoredCounts: GroupCounts = {}, restoredSkuCounts: GroupCounts = {}, restoredSkuUnits: GroupCounts = {}, restoredNames: GroupCounts = {};
        const restoredEnabled: Record<string, boolean> = {};
        for (const group of parsed.data.groups) {
          const key = String(group.rowNumber);
          if (group.count !== undefined) restoredSkuCounts[key] = String(group.count);
          if (group.unitsPerGroup !== undefined) restoredSkuUnits[key] = String(group.unitsPerGroup);
          if (group.name) restoredNames[key] = group.name;
          restoredEnabled[key] = group.enabled ?? true;
          for (const component of group.components) restoredCounts[groupCountKey(group.rowNumber, component.componentId)] = String(component.count);
        }
        if (!controller.signal.aborted) {
          setCounts(restoredCounts); setSkuCounts(restoredSkuCounts); setSkuUnits(restoredSkuUnits); setGroupNames(restoredNames); setGroupEnabled(restoredEnabled);
        }
      } catch (failure) {
        if (!controller.signal.aborted) setLoadError((failure as Error).message || "Could not load grouped packaging.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [importId, retry]);

  useEffect(() => () => { if (localPhoto) URL.revokeObjectURL(localPhoto); }, [localPhoto]);

  const used = groupEnabled[rowKey] ?? true;
  const numberOfGroups = skuCounts[rowKey] || "";
  const unitsPerGroup = skuUnits[rowKey] || "";
  const totalUnits = skuGroupTotal(numberOfGroups, unitsPerGroup);
  const perGroup = row ? groupTotals(row, counts) : { count: 0, weight: 0, weightComplete: true };
  const salesWeight = (row?.weight || 0) * (totalUnits || 0);
  const groupedWeight = perGroup.weight * (Number(numberOfGroups) || 0);
  const combinedWeight = salesWeight + groupedWeight;
  const invalid = [...Object.values(skuCounts), ...Object.values(skuUnits), ...Object.values(counts)].some((value) => value.trim() !== "" && (!Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > MAX_GROUP_COUNT));
  const locked = !canEdit || loading || saving || Boolean(loadError);
  const salesReference = useMemo(() => components.map((component) => component.weight.trim() ? `${component.name || "Component"} ${Number(component.weight).toFixed(1)} g` : component.name || "Component").join(" + "), [components]);

  function updateMap(setter: Dispatch<SetStateAction<GroupCounts>>, key: string, value: string) {
    setter((current) => ({ ...current, [key]: value })); setDirty(true); setSaveError("");
  }

  async function save() {
    if (!imported || locked || !dirty) return;
    const parsed = groupPackagingSchema.safeParse(groupCountsPayload(rows, counts, skuCounts, skuUnits, groupNames, groupEnabled));
    if (!parsed.success) { setSaveError("Enter valid whole-number quantities between 0 and 100,000."); return; }
    setSaving(true); setSaveError(""); onBusy?.(true);
    try {
      const response = await fetch(`/api/packaging-imports/${imported.id}/group-packaging`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save grouped packaging.");
      setDirty(false); toast.success("Grouped packaging saved");
    } catch (failure) { setSaveError((failure as Error).message); }
    finally { setSaving(false); onBusy?.(false); }
  }

  if (!row) return <section className="group-packaging-empty"><Layers3 size={40} /><h2>Build your grouped packaging</h2><p>Add SKUs and their components in Sales Packaging first.</p></section>;

  return (
    <div className="composition-builder group-packaging-workspace grouped-detail-workspace">
      <header className="group-packaging-heading grouped-detail-heading">
        <div><div className="grouped-title-line"><h2>Grouped packaging details</h2><span>Packaging configuration</span></div><p>Record the packaging used to hold sales units together.</p></div>
        <span className={`group-save-state ${dirty ? "unsaved" : ""}`} role="status">{loading ? "Loading…" : loadError ? "Unavailable" : dirty ? "Unsaved changes" : "Saved"}</span>
      </header>
      {loadError && <div className="group-packaging-error" role="alert"><span>{loadError}</span><button type="button" onClick={() => setRetry((value) => value + 1)}><RefreshCw size={15} /> Retry</button></div>}

      <div className="grouped-detail-grid">
        <aside className="grouped-product-panel composition-card">
          <div className="group-product-photo grouped-product-photo">
            {photo ? <img src={photo} alt={`${row.productName} grouped packaging`} /> : <div className="group-photo-placeholder"><Package size={46} /><span>No product photo yet</span></div>}
            {photo && <button type="button" className="group-photo-expand" aria-label="Expand product photo" onClick={() => setZoom(true)}><Maximize2 size={17} /></button>}
          </div>
          <div className="group-product-identity"><b>{row.productName || "Unnamed product"}</b><span>{row.sku || `Row ${row.rowNumber}`}</span></div>
          <label className="group-photo-upload"><Upload size={16} /> {localPhoto ? "Replace multipack photo" : "Upload multipack photo"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={locked} onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (localPhoto) URL.revokeObjectURL(localPhoto); setLocalPhoto(URL.createObjectURL(file)); }} /></label>
        </aside>

        <main className="grouped-form-column">
          <section className="grouped-step composition-card"><div className="grouped-step-number">1</div><div className="grouped-step-content"><h3>Is grouped packaging used?</h3><div className="grouped-radio-row">{[true, false].map((value) => <label key={String(value)} className={used === value ? "selected" : ""}><input type="radio" name={`${id}-used`} checked={used === value} disabled={locked} onChange={() => { setGroupEnabled((current) => ({ ...current, [rowKey]: value })); setDirty(true); }} />{value ? "Yes" : "No"}</label>)}</div><small>Examples: shrink wrap, cardboard sleeve, tray or carrier.</small></div></section>

          <section className="grouped-step composition-card"><div className="grouped-step-number">2</div><div className="grouped-step-content"><h3>Group configuration</h3><div className="grouped-config-grid">
            <label>Group name<input type="text" maxLength={120} value={groupNames[rowKey] || ""} disabled={locked || !used} placeholder="e.g. 3-bottle multipack" onChange={(event) => updateMap(setGroupNames, rowKey, event.target.value)} /></label>
            <label>Sales units per group<input type="number" min={0} max={MAX_GROUP_COUNT} value={unitsPerGroup} disabled={locked || !used} placeholder="0" onChange={(event) => updateMap(setSkuUnits, rowKey, event.target.value)} /></label>
            <label>Number of groups<input type="number" min={0} max={MAX_GROUP_COUNT} value={numberOfGroups} disabled={locked || !used} placeholder="0" onChange={(event) => updateMap(setSkuCounts, rowKey, event.target.value)} /></label>
          </div><div className="grouped-equation"><Calculator size={17} /><b>{numberOfGroups || 0} groups × {unitsPerGroup || 0} units = {totalUnits ?? 0} sales units</b></div></div></section>

          <section className="grouped-step composition-card"><div className="grouped-step-number">3</div><div className="grouped-step-content"><h3>Grouped packaging components</h3><div className="group-matrix-scroll grouped-components-table"><table><thead><tr><th>Component</th><th>Material</th><th>Qty / group</th><th>Weight each (g)</th><th>Weight / group (g)</th></tr></thead><tbody>
            {components.map((component, index) => { const key = groupCountKey(row.rowNumber, component.id); const quantity = Number(counts[key]) || 0; const weight = Number(component.weight) || 0; return <tr key={component.id}><td><b>{component.name || `Component ${index + 1}`}</b></td><td>{component.material || "—"}</td><td><input aria-label={`Quantity per group for ${component.name}`} type="number" min={0} max={MAX_GROUP_COUNT} value={counts[key] || ""} disabled={locked || !used} placeholder="0" onChange={(event) => updateMap(setCounts, key, event.target.value)} /></td><td>{component.weight.trim() ? weight.toFixed(2) : "—"}</td><td>{component.weight.trim() ? (quantity * weight).toFixed(2) : "—"}</td></tr>; })}
            {!components.length && <tr><td colSpan={5}>Add components in Sales Packaging first.</td></tr>}
          </tbody></table></div><div className="grouped-add-note"><button type="button" disabled><Plus size={15} /> Add component</button><span>Components are managed in Sales Packaging.</span></div></div></section>

          <section className="grouped-reference composition-card"><button type="button" onClick={() => setReferenceOpen((value) => !value)} aria-expanded={referenceOpen}><span><i>4</i><b>Included sales packaging — reference only</b></span><ChevronDown size={17} /></button>{referenceOpen && <p>{salesReference || "No component weights have been recorded."}{row.weight ? ` = ${row.weight.toFixed(2)} g per sales unit` : ""}</p>}</section>
        </main>

        <aside className="grouped-summary composition-card"><h3>Weight summary</h3><dl><div><dt>Sales packaging ({totalUnits || 0} units)</dt><dd>{salesWeight.toFixed(1)} g</dd></div><div><dt>Grouped packaging ({numberOfGroups || 0} groups)</dt><dd>{groupedWeight.toFixed(1)} g</dd></div><div className="total"><dt>Combined packaging</dt><dd>{combinedWeight.toFixed(1)} g</dd></div></dl><div className="grouped-info"><Info size={17} /><span>Count each outer packaging component once per group.</span></div>{(invalid || saveError) && <p className="group-packaging-error" role="alert">{saveError || "Use whole numbers between 0 and 100,000."}</p>}{canEdit && <button type="button" className="group-save-button grouped-save-button" disabled={!dirty || locked || invalid} onClick={() => void save()}>{saving ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}{saving ? "Saving…" : "Save grouped packaging"}</button>}</aside>
      </div>
      <Modal opened={zoom} onClose={() => setZoom(false)} title={row.productName || "Product photo"} centered size="lg">{photo && <img className="group-zoom-image" src={photo} alt={`${row.productName} grouped packaging`} />}</Modal>
    </div>
  );
}
