"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  ChartNoAxesCombined,
  Eye,
  Package,
  Search,
  Sparkles,
} from "lucide-react";
import styles from "./sku-analysis.module.css";

export type SkuAnalysisItem = {
  importId: string;
  rowNumber: number;
  sku: string;
  name: string;
  image: string;
};
export function SkuAnalysisDirectory({
  items,
  backHref = "/dashboard/clients",
  backLabel = "Client onboarding",
  title = "SKU Analyse",
  description = "Explore your SKUs and open saved packaging details.",
}: {
  items: SkuAnalysisItem[];
  backHref?: string;
  backLabel?: string;
  title?: string;
  description?: string;
}) {
  const [query, setQuery] = useState("");
  const shown = items.filter((item) =>
    `${item.sku} ${item.name}`
      .toLowerCase()
      .includes(query.toLowerCase().trim()),
  );
  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span>PACKAGING INTELLIGENCE</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <label className={styles.search}>
          <Search size={17} />
          <input
            aria-label="Search SKUs"
            placeholder="Search SKU or product…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </header>
      <section className={styles.listCard}>
        <div className={styles.listHeader}>
          <div>
            <h2>SKU list</h2>
            <p>Open saved packaging details or jump straight to articles.</p>
          </div>
          <b>{shown.length}</b>
        </div>
        <div className={`table-scroll ${styles.tableScroll}`}>
          <table className={styles.skuTable}>
            <thead>
              <tr>
                <th>Preview</th>
                <th>SKU</th>
                <th>Product</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((item) => (
                <tr key={`${item.importId}-${item.rowNumber}`}>
                  <td>
                    <div className={styles.previewCell}>
                      {item.image ? (
                        <img
                          src={`/api/packaging-imports/${item.importId}/assets/${item.image}`}
                          alt={item.name}
                        />
                      ) : (
                        <Package size={28} strokeWidth={1.4} />
                      )}
                    </div>
                  </td>
                  <td>
                    <b>{item.sku || "SKU pending"}</b>
                  </td>
                  <td>
                    <b>{item.name || "Unnamed product"}</b>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <Link
                        href={`/dashboard/packaging/${item.importId}/${item.rowNumber}/analyse?view=sku-assessment`}
                        className={styles.actionButton}
                        aria-label={`Open article analysis for ${item.name || item.sku || "SKU"}`}
                        title="Open article analysis"
                      >
                        <ChartNoAxesCombined size={16} />
                      </Link>
                      <Link
                        href={`/dashboard/clients?packaging=${item.importId}&row=${item.rowNumber}&returnTo=sku-analysis`}
                        className={styles.actionButton}
                        aria-label={`View packaging details for ${item.name || item.sku || "SKU"}`}
                        title="View packaging details"
                      >
                        <Eye size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {!shown.length && (
        <div className={styles.empty}>
          <Boxes size={38} />
          <h2>{items.length ? "No matching SKUs" : "No SKUs yet"}</h2>
          <p>
            {items.length
              ? "Try another product name or SKU."
              : "Add packaging in Client onboarding to see its SKUs here."}
          </p>
          <Link href={backHref}>
            {backLabel} <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SkuAnalysisOverview({
  importId,
  rowNumber,
  sku,
  name,
  images,
}: {
  importId: string;
  rowNumber: number;
  sku: string;
  name: string;
  images: string[];
}) {
  const selectedImage = images[0] || "";
  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span>SKU ANALYSE · PACKAGING OVERVIEW</span>
          <h1>{name || "Product name pending"}</h1>
          <p>Review your SKU and open its analysis.</p>
        </div>
        <Link className={styles.back} href="/dashboard/sku-analysis">
          <ArrowLeft size={15} /> All SKUs
        </Link>
      </header>
      <div className={styles.overview}>
        <section className={styles.gallery} aria-label="SKU photo gallery">
          <div className={styles.mainImage}>
            {selectedImage ? (
              <img
                key={selectedImage}
                src={`/api/packaging-imports/${importId}/assets/${selectedImage}`}
                alt={name}
              />
            ) : (
              <div className={styles.noPhoto}>
                <Package size={75} strokeWidth={1} />
                <span>No product photo available</span>
              </div>
            )}
          </div>
        </section>
        <section className={styles.productDetails}>
          <span className={styles.badge}>
            <Boxes size={14} /> SKU overview
          </span>
          <h2>{name || "Unnamed product"}</h2>
          <dl>
            <div>
              <dt>SKU</dt>
              <dd>{sku || "Not provided"}</dd>
            </div>
          </dl>
          <p>View the main product image and start SKU analysis.</p>
          <Link
            className={styles.analyse}
            href={`/dashboard/packaging/${importId}/${rowNumber}/analyse?view=sku-assessment`}
          >
            <Sparkles size={17} /> Analyse <ArrowRight size={17} />
          </Link>
          <Link
            className={styles.edit}
            href={`/dashboard/clients?packaging=${importId}&row=${rowNumber}`}
          >
            Packaging workspace <ArrowRight size={14} />
          </Link>
        </section>
      </div>
    </div>
  );
}
