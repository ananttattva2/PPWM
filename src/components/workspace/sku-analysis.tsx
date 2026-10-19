"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Clock3,
  Layers3,
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
  count: number;
};
export type SkuComponent = {
  id: string;
  name: string;
  image: string;
  material: string;
  weight: string;
  supplier: string;
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
          <p>Explore each SKU and its packaging components.</p>
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
              <p>
                <Layers3 size={13} /> {item.count} components
              </p>
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
  components,
}: {
  importId: string;
  rowNumber: number;
  sku: string;
  name: string;
  images: string[];
  components: SkuComponent[];
}) {
  const [selected, setSelected] = useState("sku:0");
  const [comingSoon, setComingSoon] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const analyse = useRef<HTMLButtonElement>(null);
  const current = selected.startsWith("component:")
    ? components.find((component) => component.id === selected.slice(10))
    : undefined;
  const selectedImage = current
    ? current.image
    : images[Number(selected.split(":")[1]) || 0] || "";
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
          <p>Review the complete product and all its packaging components.</p>
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
                alt={current?.name || name}
              />
            ) : (
              <div className={styles.noPhoto}>
                <Package size={75} strokeWidth={1} />
                <span>
                  No {current ? "component" : "product"} photo available
                </span>
              </div>
            )}
          </div>
          <div
            className={styles.thumbnails}
            aria-label="Product and component photos"
          >
            {(images.length ? images : [""]).map((image, index) => (
              <button
                key={`product-${index}`}
                type="button"
                aria-label={
                  index === 0 ? "Main SKU image" : `SKU photo ${index + 1}`
                }
                aria-pressed={selected === `sku:${index}`}
                onClick={() => setSelected(`sku:${index}`)}
              >
                {image ? (
                  <img
                    src={`/api/packaging-imports/${importId}/assets/${image}`}
                    alt=""
                  />
                ) : (
                  <Package size={25} />
                )}
                <small>{index === 0 ? "SKU" : `Photo ${index + 1}`}</small>
              </button>
            ))}
            {components.map((component, index) => (
              <button
                key={component.id}
                type="button"
                aria-label={`View ${component.name || `component ${index + 1}`} image`}
                aria-pressed={selected === `component:${component.id}`}
                onClick={() => setSelected(`component:${component.id}`)}
              >
                {component.image ? (
                  <img
                    src={`/api/packaging-imports/${importId}/assets/${component.image}`}
                    alt=""
                  />
                ) : (
                  <Package size={25} />
                )}
                <small>{component.name || `Part ${index + 1}`}</small>
              </button>
            ))}
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
            <div>
              <dt>Packaging components</dt>
              <dd>{components.length}</dd>
            </div>
            <div>
              <dt>Selected view</dt>
              <dd>{current?.name || "Main product"}</dd>
            </div>
          </dl>
          <p>
            Explore the saved packaging photos and components, then open SKU
            analysis.
          </p>
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
      <div className={styles.componentHeading}>
        <h2>
          Packaging components <span>{components.length}</span>
        </h2>
        <p>All components saved for this SKU.</p>
      </div>
      <div className={styles.components}>
        {components.map((component, index) => (
          <article key={component.id} className={styles.component}>
            <button
              className={styles.componentPhoto}
              type="button"
              onClick={() => {
                setSelected(`component:${component.id}`);
                window.scrollTo({
                  top: 0,
                  behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                  ).matches
                    ? "instant"
                    : "smooth",
                });
              }}
              aria-label={`Preview ${component.name || `component ${index + 1}`}`}
            >
              {component.image ? (
                <img
                  src={`/api/packaging-imports/${importId}/assets/${component.image}`}
                  alt={component.name}
                />
              ) : (
                <Package size={38} strokeWidth={1.2} />
              )}
            </button>
            <div className={styles.componentCopy}>
              <small>COMPONENT {String(index + 1).padStart(2, "0")}</small>
              <h3>{component.name || `Component ${index + 1}`}</h3>
              <p>
                {component.material || "Material not provided"}
                <span>·</span>
                {component.weight
                  ? `${component.weight} g`
                  : "Weight not provided"}
              </p>
              <p>{component.supplier || "Supplier not provided"}</p>
              <Link
                href={`/dashboard/packaging/${importId}/${rowNumber}/analyse?component=${encodeURIComponent(component.id)}&view=component`}
              >
                Review component <ArrowRight size={13} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!components.length && (
        <div className={styles.empty}>
          <Layers3 size={35} />
          <h3>No components saved yet</h3>
          <p>Add components in the packaging workspace to see them here.</p>
        </div>
      )}
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
            SKU-level analysis is on its way. You can explore your product
            images and packaging components in the meantime.
          </p>
          <button type="button" className={styles.analyse} onClick={close}>
            Back to SKU <ArrowLeft size={16} />
          </button>
        </div>
      </dialog>
    </div>
  );
}
