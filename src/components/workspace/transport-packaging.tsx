"use client";
import { useEffect, useState } from "react";
import { Info, LoaderCircle, Package, Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { ImportResult } from "@/lib/packaging-import-schema";
import { transportPackagingSchema, transportWeightPerLoad, type TransportPackagingData } from "@/lib/transport-packaging";

const materials = ["Wood", "LDPE", "PP", "HDPE", "PET", "Paper/cardboard", "Metal", "Other"];
const blankComponent = () => ({ id: crypto.randomUUID(), name: "", material: "", quantityPerLoad: 1, weightEach: 0 });

export default function TransportPackaging({ imported, initialRowNumber, canEdit, onBusy }: {
  imported: ImportResult;
  initialRowNumber: number;
  canEdit: boolean;
  onBusy?: (busy: boolean) => void;
}) {
  const row = imported.analysis.rows.find((item) => item.rowNumber === initialRowNumber) || imported.analysis.rows[0];
  const [data, setData] = useState<TransportPackagingData>(() => ({
    rowNumber: row.rowNumber, used: "yes", loadName: "", groupsPerLoad: 0, numberOfLoads: 0,
    components: [blankComponent()], palletReusable: true, returnSystem: "", recordedRotations: 0,
  }));
  const [photo, setPhoto] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/packaging-imports/${imported.id}/transport-packaging?rowNumber=${row.rowNumber}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load transport packaging.");
        if (body) {
          const parsed = transportPackagingSchema.safeParse(body);
          if (!parsed.success) throw new Error("Saved transport packaging could not be read.");
          setData(parsed.data);
        }
      })
      .catch((failure) => { if (!controller.signal.aborted) setError((failure as Error).message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [imported.id, row.rowNumber]);

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);
  const weightPerLoad = transportWeightPerLoad(data);
  const dispatched = weightPerLoad * data.numberOfLoads;
  const locked = !canEdit || loading || saving;
  const update = <K extends keyof TransportPackagingData>(key: K, value: TransportPackagingData[K]) => {
    setData((current) => ({ ...current, [key]: value })); setDirty(true); setError("");
  };
  const updateComponent = (id: string, changes: Partial<TransportPackagingData["components"][number]>) => {
    update("components", data.components.map((component) => component.id === id ? { ...component, ...changes } : component));
  };
  async function save() {
    const parsed = transportPackagingSchema.safeParse(data);
    if (!parsed.success) { setError("Enter valid transport packaging details before saving."); return; }
    setSaving(true); onBusy?.(true); setError("");
    try {
      const response = await fetch(`/api/packaging-imports/${imported.id}/transport-packaging`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not save transport packaging.");
      setDirty(false); toast.success("Transport packaging saved");
    } catch (failure) { setError((failure as Error).message); }
    finally { setSaving(false); onBusy?.(false); }
  }

  return <div className="transport-workspace">
    <header className="transport-heading"><div><div><h2>Transport packaging details</h2><span>Packaging configuration</span></div><p>Record the packaging used to transport grouped or sales packaging.</p></div><span className={dirty ? "unsaved" : ""}>{loading ? "Loading…" : dirty ? "Unsaved changes" : "Saved"}</span></header>
    <div className="transport-grid">
      <aside className="transport-photo-card composition-card">
        <h3>Transport packaging photo</h3>
        <div className="transport-photo">{photo ? <img src={photo} alt="Transport packaging preview" /> : <><Package size={52} /><span>No transport photo yet</span></>}</div>
        <b>{data.loadName || row.productName || "Transport load"}</b><p>{row.productName} · {row.sku}</p>
        <label><Upload size={16} /> {photo ? "Replace photo" : "Upload photo"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={locked} onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (photo) URL.revokeObjectURL(photo); setPhoto(URL.createObjectURL(file)); }} /></label>
        <small>JPG, PNG or WEBP. Max 10 MB.</small>
      </aside>

      <main className="transport-form">
        <section className="transport-step composition-card"><i>1</i><div><h3>Is transport packaging used?</h3><small>Select whether additional packaging is used to transport the sales packaging.</small><div className="transport-options">{(["yes", "no", "na"] as const).map((value) => <label key={value} className={data.used === value ? "selected" : ""}><input type="radio" checked={data.used === value} disabled={locked} onChange={() => update("used", value)} />{value === "yes" ? "Yes" : value === "no" ? "No" : "Not applicable"}</label>)}</div></div></section>
        <section className="transport-step composition-card"><i>2</i><div><h3>Load configuration</h3><small>Define the configuration of the transport load (e.g. pallet).</small><div className="transport-config"><label>Load name<input value={data.loadName} disabled={locked || data.used !== "yes"} placeholder="e.g. Water bottle shipment" onChange={(event) => update("loadName", event.target.value)} /></label><label>Groups per load<input type="number" min={0} value={data.groupsPerLoad} disabled={locked || data.used !== "yes"} onChange={(event) => update("groupsPerLoad", Number(event.target.value))} /></label><label>Number of loads<input type="number" min={0} value={data.numberOfLoads} disabled={locked || data.used !== "yes"} onChange={(event) => update("numberOfLoads", Number(event.target.value))} /></label></div></div></section>
        <section className="transport-step composition-card"><i>3</i><div><h3>Components</h3><small>List the components used in the transport packaging for each load.</small><div className="transport-table"><table><thead><tr><th>Component</th><th>Material</th><th>Qty/load</th><th>Weight each (g)</th><th>Total/load (g)</th><th /></tr></thead><tbody>{data.components.map((component) => <tr key={component.id}><td><input aria-label="Component name" value={component.name} disabled={locked || data.used !== "yes"} onChange={(event) => updateComponent(component.id, { name: event.target.value })} /></td><td><select aria-label="Component material" value={component.material} disabled={locked || data.used !== "yes"} onChange={(event) => updateComponent(component.id, { material: event.target.value })}><option value="">Select</option>{materials.map((material) => <option key={material}>{material}</option>)}</select></td><td><input aria-label="Quantity per load" type="number" min={0} value={component.quantityPerLoad} disabled={locked || data.used !== "yes"} onChange={(event) => updateComponent(component.id, { quantityPerLoad: Number(event.target.value) })} /></td><td><input aria-label="Weight each" type="number" min={0} step="0.01" value={component.weightEach} disabled={locked || data.used !== "yes"} onChange={(event) => updateComponent(component.id, { weightEach: Number(event.target.value) })} /></td><td>{(component.quantityPerLoad * component.weightEach).toFixed(1)}</td><td><button type="button" aria-label="Remove component" disabled={locked || data.components.length === 1} onClick={() => update("components", data.components.filter((item) => item.id !== component.id))}><Trash2 size={14} /></button></td></tr>)}</tbody></table></div><button className="transport-add" type="button" disabled={locked || data.used !== "yes" || data.components.length >= 30} onClick={() => update("components", [...data.components, blankComponent()])}><Plus size={15} /> Add component</button></div></section>
        <section className="transport-step composition-card"><i>4</i><div><h3>Reuse details</h3><small>Provide information about reuse of transport packaging components.</small><div className="transport-reuse"><fieldset><legend>Pallet reusable?</legend>{[true, false].map((value) => <label key={String(value)} className={data.palletReusable === value ? "selected" : ""}><input type="radio" checked={data.palletReusable === value} disabled={locked} onChange={() => update("palletReusable", value)} />{value ? "Yes" : "No"}</label>)}</fieldset><label>Return system<select value={data.returnSystem} disabled={locked || !data.palletReusable} onChange={(event) => update("returnSystem", event.target.value)}><option value="">Select system</option><option>Pallet collection</option><option>Supplier return</option><option>Deposit system</option><option>Internal circulation</option></select></label><label>Recorded rotations<input type="number" min={0} value={data.recordedRotations} disabled={locked || !data.palletReusable} onChange={(event) => update("recordedRotations", Number(event.target.value))} /></label></div></div></section>
      </main>

      <aside className="transport-summary composition-card"><h3>Summary</h3><small>Weight per load</small><strong>{(weightPerLoad / 1000).toFixed(1)} kg</strong><small>Loads</small><strong>{data.numberOfLoads}</strong><hr /><small>Packaging dispatched</small><strong>{(dispatched / 1000).toFixed(1)} kg</strong><div><Info size={17} /><span>Dispatch weight includes reusable components; track returns separately.</span></div>{error && <p role="alert">{error}</p>}{canEdit && <button type="button" disabled={locked || !dirty} onClick={() => void save()}>{saving ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}{saving ? "Saving…" : "Save details"}</button>}</aside>
    </div>
  </div>;
}
