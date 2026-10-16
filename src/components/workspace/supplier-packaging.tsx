"use client";
import Link from "next/link";
import { Package } from "lucide-react";
import type { PackagingRow } from "@/lib/packaging-import-schema";
import PackagingGallery from "./packaging-gallery";
import { useState } from "react";
import { toast } from "sonner";
import styles from "./supplier-packaging.module.css";

export default function SupplierPackaging({
  assignments,
}: {
  assignments: { importId: string; rows: PackagingRow[] }[];
}) {
  const [items, setItems] = useState(assignments);
  const [busy, setBusy] = useState(false);
  async function upload(
    importId: string,
    rowNumber: number,
    componentId: string,
    file?: File,
  ) {
    if (!file || busy) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.set("rowNumber", String(rowNumber));
      form.set("componentId", componentId);
      form.set("photos", file);
      const response = await fetch(
        `/api/packaging-imports/${importId}/photos`,
        { method: "POST", body: form },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not upload photo.");
      setItems((current) =>
        current.map((item) =>
          item.importId !== importId
            ? item
            : {
                ...item,
                rows: item.rows.map((row) =>
                  row.rowNumber !== rowNumber
                    ? row
                    : { ...row, composition: data.composition },
                ),
              },
        ),
      );
      toast.success("Component photo saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not upload photo.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="composition-builder">
      <header className="composition-heading">
        <div>
          <span className="composition-eyebrow">SUPPLIER WORKSPACE</span>
          <h1>Your packaging components</h1>
          <p>Review and analyse the components assigned to your email.</p>
        </div>
      </header>
      {!assignments.length && (
        <section className="composition-card">
          <Package size={32} />
          <h2>No components assigned</h2>
          <p>
            Components will appear here when the owner saves packaging with your
            supplier email.
          </p>
        </section>
      )}
      {items.flatMap(({ importId, rows }) =>
        rows.map((row) => (
          <section key={`${importId}-${row.rowNumber}`} className={styles.grid}>
            <div className="composition-card">
              <div className="composition-card-title">
                <h2>Packaging components</h2>
                <span>{row.composition!.components.length}</span>
              </div>
              <p>
                {row.productName} · {row.sku}
              </p>
              {row.composition!.components.map((component) => (
                <article className={styles.component} key={component.id}>
                  <div className={styles.photo}>
                    {component.image && (
                      <img
                        src={`/api/packaging-imports/${importId}/assets/${component.image}`}
                        alt={component.name}
                        width={100}
                        height={120}
                        style={{ objectFit: "contain" }}
                      />
                    )}
                    {!component.image && (
                      <div className={styles.placeholder}>
                        <Package size={36} aria-hidden="true" />
                      </div>
                    )}
                    <label className={styles.upload}>
                      {component.image ? "Replace photo" : "Upload photo"}
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/png,image/jpeg"
                        disabled={busy}
                        aria-label={`Upload ${component.name} photo`}
                        onChange={(event) => {
                          void upload(
                            importId,
                            row.rowNumber,
                            component.id,
                            event.target.files?.[0],
                          );
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <h3>{component.name}</h3>
                  <Link
                    className="gallery-analyse-link"
                    href={`/dashboard/packaging/${importId}/${row.rowNumber}/analyse?component=${encodeURIComponent(component.id)}`}
                  >
                    Analyse
                  </Link>
                </article>
              ))}
            </div>
            <PackagingGallery
              row={row}
              importId={importId}
              disabled
              readOnly
              onSaved={() => {}}
              onBusy={() => {}}
            />
          </section>
        )),
      )}
    </div>
  );
}
