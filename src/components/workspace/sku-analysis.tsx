"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Clock3,
  Package,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import styles from "./sku-analysis.module.css";

export type SkuAnalysisItem = {
  importId: string;
  rowNumber: number;
  sku: string;
  name: string;
  image: string;
};
export function SkuAnalysisDirectory({ items }: { items: SkuAnalysisItem[] }) {
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
          <h1>SKU Analyse</h1>
          <p>Explore your SKUs and open SKU analysis.</p>
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
      <div className={styles.directory}>
        {shown.map((item) => (
          <Link
            key={`${item.importId}-${item.rowNumber}`}
            href={`/dashboard/packaging/${item.importId}/${item.rowNumber}/analyse`}
            className={styles.skuCard}
          >
            <div className={styles.preview}>
              {item.image ? (
                <img
                  src={`/api/packaging-imports/${item.importId}/assets/${item.image}`}
                  alt={item.name}
                />
              ) : (
                <Package size={45} strokeWidth={1.2} />
              )}
            </div>
            <div>
              <small>{item.sku || "SKU pending"}</small>
              <h2>{item.name || "Unnamed product"}</h2>
            </div>
            <span className={styles.open}>
              <ArrowRight size={17} />
            </span>
          </Link>
        ))}
      </div>
      {!shown.length && (
        <div className={styles.empty}>
          <Boxes size={38} />
          <h2>{items.length ? "No matching SKUs" : "No SKUs yet"}</h2>
          <p>
            {items.length
              ? "Try another product name or SKU."
              : "Add packaging in Client onboarding to see its SKUs here."}
          </p>
          <Link href="/dashboard/clients">
            Client onboarding <ArrowRight size={15} />
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
  const [comingSoon, setComingSoon] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const analyse = useRef<HTMLButtonElement>(null);
  const selectedImage = images[0] || "";
  useEffect(() => {
    if (comingSoon) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      dialog.current?.showModal();
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    } else if (dialog.current?.open) dialog.current.close();
  }, [comingSoon]);
  function close() {
    setComingSoon(false);
    analyse.current?.focus();
  }
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
          <button
            ref={analyse}
            className={styles.analyse}
            type="button"
            onClick={() => setComingSoon(true)}
          >
            <Sparkles size={17} /> Analyse <ArrowRight size={17} />
          </button>
          <Link
            className={styles.edit}
            href={`/dashboard/clients?packaging=${importId}&row=${rowNumber}`}
          >
            Packaging workspace <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="sku-coming-soon-title"
        aria-describedby="sku-coming-soon-description"
        onCancel={() => setComingSoon(false)}
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={styles.dialogContent}>
          <button
            className={styles.close}
            type="button"
            aria-label="Close coming soon"
            onClick={close}
          >
            <X size={19} />
          </button>
          <div className={styles.soonIcon}>
            <Clock3 size={34} strokeWidth={1.5} />
          </div>
          <span>SKU ANALYSIS</span>
          <h2 id="sku-coming-soon-title">Coming soon</h2>
          <p id="sku-coming-soon-description">
            SKU-level analysis is on its way. You can review your SKU details in
            the meantime.
          </p>
          <button type="button" className={styles.analyse} onClick={close}>
            Back to SKU <ArrowLeft size={16} />
          </button>
        </div>
      </dialog>
    </div>
  );
}
