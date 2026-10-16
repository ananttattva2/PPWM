"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Modal } from "@mantine/core";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Package,
  Plus,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { PackagingRow } from "@/lib/packaging-import-schema";
import type { PackagingComposition } from "@/lib/packaging-composition";

export default function PackagingGallery({
  row,
  importId,
  onSaved,
  onBusy,
  disabled = false,
  readOnly = false,
}: {
  disabled?: boolean;
  readOnly?: boolean;
  row: PackagingRow;
  importId: string;
  onSaved: (composition: PackagingComposition) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [selected, setSelected] = useState("");
  const [direction, setDirection] = useState(1);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const thumbnails = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const composition = row.composition;
  const photos = [
    ...new Set(
      [
        composition?.productImage,
        ...(composition?.productImages || []),
        ...(composition?.components.map((component) => component.image) || []),
      ].filter((id): id is string => Boolean(id)),
    ),
  ];
  const active = photos.includes(selected) ? selected : photos[0];
  const index = photos.indexOf(active);
  useEffect(() => {
    if (selected)
      thumbnails.current
        ?.querySelector('[aria-pressed="true"]')
        ?.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "nearest",
          inline: "nearest",
        });
  }, [selected, reducedMotion]);
  const image = (id: string) =>
    `/api/packaging-imports/${importId}/assets/${id}`;
  function show(next: number) {
    if (photos.length < 2) return;
    setDirection(next > index ? 1 : -1);
    setSelected(photos[(next + photos.length) % photos.length]);
  }
  async function upload(files: File[]) {
    if (!files.length || busy || disabled) return;
    if (
      files.length > 6 ||
      files.some(
        (file) =>
          !file.size ||
          file.size > 2 * 1024 * 1024 ||
          !["image/png", "image/jpeg"].includes(file.type),
      )
    ) {
      toast.error("Choose up to 6 PNG or JPEG photos, 2 MB each.");
      return;
    }
    const productCount =
      (composition?.productImage ? 1 : 0) +
      (composition?.productImages?.length || 0);
    if (productCount + files.length > 12) {
      toast.error("Keep a maximum of 12 product photos per SKU.");
      return;
    }
    setBusy(true);
    onBusy(true);
    try {
      const data = new FormData();
      data.append("rowNumber", String(row.rowNumber));
      files.forEach((file) => data.append("photos", file));
      const response = await fetch(
        `/api/packaging-imports/${importId}/photos`,
        { method: "POST", body: data },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not upload photos.");
      onSaved(result.composition);
      setDirection(1);
      setSelected(
        result.composition.productImages.at(-1) ||
          result.composition.productImage,
      );
      toast.success(
        `${files.length} ${files.length === 1 ? "photo" : "photos"} uploaded and saved`,
      );
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  function controls() {
    return (
      <>
        <button
          type="button"
          aria-label="Previous product photo"
          disabled={photos.length < 2}
          onClick={() => show(index - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <span aria-live="polite">
          {photos.length ? index + 1 : 0} / {photos.length}
        </span>
        <button
          type="button"
          aria-label="Next product photo"
          disabled={photos.length < 2}
          onClick={() => show(index + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </>
    );
  }
  return (
    <section
      className="composition-card packaging-gallery"
      aria-label="Product photo gallery"
    >
      <div className="composition-card-title">
        <h3>Product preview</h3>
        <span className="gallery-count">{photos.length} photos</span>
      </div>
      <div
        className="gallery-stage"
        tabIndex={0}
        aria-label="Product photos. Use left and right arrow keys to browse."
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            show(index + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
      >
        {active ? (
          <>
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.img
                key={active}
                draggable={false}
                src={image(active)}
                alt={`${row.productName || "Product"} photo ${index + 1}`}
                custom={direction}
                initial={{ opacity: 0, x: reducedMotion ? 0 : direction * 35 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reducedMotion ? 0 : -direction * 35 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.23,
                  ease: "easeOut",
                }}
                drag={photos.length > 1 && !reducedMotion ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 30)
                    show(index + (info.offset.x < 0 ? 1 : -1));
                }}
              />
            </AnimatePresence>
            <button
              type="button"
              className="gallery-expand"
              aria-label="Expand product photo"
              onClick={() => setZoom(true)}
            >
              <Maximize2 size={17} />
            </button>
          </>
        ) : (
          <div className="composition-view-placeholder">
            <Package size={38} />
            <p>Upload photos to see every angle of your product.</p>
          </div>
        )}
      </div>
      <div className="gallery-thumbnail-nav">
        <button
          type="button"
          aria-label="Previous product photo"
          disabled={photos.length < 2}
          onClick={() => show(index - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <div
          ref={thumbnails}
          className="gallery-thumbnails"
          aria-label="Choose product photo"
        >
          {photos.map((id, photoIndex) => (
            <button
              key={id}
              type="button"
              aria-label={`Show product photo ${photoIndex + 1}`}
              aria-pressed={id === active}
              onClick={() => show(photoIndex)}
            >
              <img src={image(id)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Next product photo"
          disabled={photos.length < 2}
          onClick={() => show(index + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="gallery-footer">
        <span aria-live="polite">
          {photos.length
            ? `${index + 1} of ${photos.length} · Swipe or use arrows`
            : "No photos yet"}
        </span>
        {!readOnly && (
          <button
            type="button"
            className="gallery-upload"
            disabled={busy || disabled}
            onClick={() => input.current?.click()}
          >
            {busy ? (
              <LoaderCircle size={14} className="spin" />
            ) : (
              <Plus size={15} />
            )}
            {busy ? "Uploading…" : "Add photos"}
          </button>
        )}
      </div>
      <input
        ref={input}
        className="sr-only"
        type="file"
        multiple
        accept="image/png,image/jpeg"
        aria-label="Upload additional product photos"
        disabled={busy || disabled}
        onChange={(event) => {
          void upload(Array.from(event.target.files || []));
          event.target.value = "";
        }}
      />
      {!readOnly && (
        <p className="composition-help">
          PNG / JPEG · 2 MB each · Up to 12 product photos. Uploads save
          automatically.
        </p>
      )}
      <Modal
        opened={zoom}
        onClose={() => setZoom(false)}
        title={row.productName || "Product photo"}
        size="xl"
        centered
      >
        <div className="gallery-lightbox">
          {active && (
            <img
              src={image(active)}
              alt={`${row.productName || "Product"} photo ${index + 1}`}
            />
          )}
          <div className="gallery-lightbox-controls">{controls()}</div>
        </div>
      </Modal>
    </section>
  );
}
