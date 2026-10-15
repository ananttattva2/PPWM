"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CloudUpload,
  Download,
  Eye,
  FileText,
  ImageIcon,
  LoaderCircle,
  Plus,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  PROOF_BATCH_LIMIT,
  PROOF_MAX_SIZE,
  type SustainabilityProof,
} from "@/lib/sustainability-proof";

export default function SustainabilityProofUpload({
  requirementId,
  title,
  url,
  canEdit,
  loading,
  proofs,
  onUploaded,
}: {
  requirementId: string;
  title: string;
  url: string;
  canEdit: boolean;
  loading: boolean;
  proofs: SustainabilityProof[];
  onUploaded: (proofs: SustainabilityProof[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<SustainabilityProof | null>(null);
  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  useEffect(() => {
    if (!closing) return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 180;
    const timer = window.setTimeout(() => {
      dialog.current?.close();
      setOpen(false);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [closing]);
  function close() {
    setClosing(true);
  }
  function fileUrl(proof: SustainabilityProof, preview = false) {
    return `${url}&file=${encodeURIComponent(proof.id)}${preview ? "&preview=1" : ""}`;
  }
  async function upload(files: File[]) {
    if (!files.length || busy || !canEdit) return;
    setError("");
    setMessage("");
    if (
      files.length > PROOF_BATCH_LIMIT ||
      files.some(
        (file) =>
          !file.size ||
          file.size > PROOF_MAX_SIZE ||
          ![
            "image/png",
            "image/jpeg",
            "image/webp",
            "application/pdf",
          ].includes(file.type),
      )
    ) {
      setError("Choose up to 6 PNG, JPEG, WebP or PDF files, 2 MB each.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.set("requirementId", requirementId);
      files.forEach((file) => form.append("files", file));
      const response = await fetch(url, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Could not upload proofs. Please try again.",
        );
      onUploaded(data.proofs);
      setSelected(data.proofs[0] || null);
      setMessage(
        `${files.length} ${files.length === 1 ? "proof" : "proofs"} saved.`,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not upload proofs. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="sustainability-proof-upload" aria-label={`${title} proofs`}>
      {(canEdit || proofs.length > 0) && (
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => {
            setClosing(false);
            setOpen(true);
          }}
          aria-label={`${canEdit ? "Add proof" : "View proofs"} for ${title}`}
        >
          {canEdit ? <Plus size={17} /> : <Eye size={17} />}{" "}
          {canEdit ? "Add proof" : "View proofs"}
          {proofs.length > 0 && (
            <span className="proof-count">{proofs.length}</span>
          )}
        </Button>
      )}
      {loading && <p role="status">Loading proofs…</p>}
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className={`proof-dialog ${closing ? "proof-dialog-closing" : ""}`}
            aria-labelledby={headingId}
            onCancel={(event) => {
              event.preventDefault();
              close();
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) close();
            }}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget && closing) {
                dialog.current?.close();
                setOpen(false);
              }
            }}
          >
            <div className="proof-dialog-content">
              <header className="proof-dialog-header">
                <div>
                  <span className="proof-eyebrow">SUSTAINABILITY EVIDENCE</span>
                  <h2 id={headingId}>{title}</h2>
                  <p>Add documents and images to support this requirement.</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={close}
                  aria-label="Close proof upload"
                >
                  <X size={20} />
                </Button>
              </header>
              {canEdit && (
                <section
                  className={`proof-dropzone ${dragging ? "proof-dropzone-active" : ""} ${busy ? "proof-dropzone-busy" : ""}`}
                  aria-label="Proof upload area"
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!busy) setDragging(true);
                  }}
                  onDragLeave={(event) => {
                    if (
                      !event.currentTarget.contains(event.relatedTarget as Node)
                    )
                      setDragging(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    void upload(Array.from(event.dataTransfer.files));
                  }}
                >
                  <div className="proof-upload-art" aria-hidden="true">
                    <span className="proof-art-ring" />
                    <FileText className="proof-art-document" />
                    <CloudUpload className="proof-art-cloud proof-art-cloud-left" />
                    <CloudUpload className="proof-art-cloud proof-art-cloud-right" />
                    <span className="proof-art-spark">✦</span>
                    <span className="proof-art-plus">+</span>
                  </div>
                  <h3>
                    {busy
                      ? "Uploading your proofs…"
                      : dragging
                        ? "Drop your files here"
                        : "Drag & drop your proof here"}
                  </h3>
                  <p>
                    Images, certificates or test reports — keep everything
                    together.
                  </p>
                  <input
                    ref={input}
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    hidden
                    aria-label={`Upload proofs for ${title}`}
                    disabled={busy}
                    onChange={(event) => {
                      const files = Array.from(event.target.files || []);
                      event.target.value = "";
                      void upload(files);
                    }}
                  />
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => input.current?.click()}
                  >
                    {busy ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Plus size={17} />
                    )}{" "}
                    {busy ? "Uploading…" : "Browse files"}
                  </Button>
                  <small>
                    PNG, JPG, WebP & PDF · Up to 6 files at once · 2 MB per file
                  </small>
                </section>
              )}
              <p className="sustainability-proof-status" role="status">
                {message}
              </p>
              {error && (
                <p className="sustainability-proof-error" role="alert">
                  {error}
                </p>
              )}
              <section className="proof-library" aria-label="Uploaded proofs">
                <div className="proof-library-heading">
                  <h3>
                    Uploaded proofs <span>{proofs.length}</span>
                  </h3>
                  <span>Saved to this component</span>
                </div>
                {proofs.length === 0 ? (
                  <p className="proof-library-empty">
                    No proofs yet. Upload an image or PDF to get started.
                  </p>
                ) : (
                  <div className="proof-library-layout">
                    <ul className="proof-library-files">
                      {proofs.map((proof) => (
                        <li key={proof.id}>
                          <button
                            type="button"
                            className={
                              selected?.id === proof.id
                                ? "proof-file-selected"
                                : ""
                            }
                            aria-label={`View ${proof.name}`}
                            aria-pressed={selected?.id === proof.id}
                            onClick={() => setSelected(proof)}
                          >
                            {proof.type === "application/pdf" ? (
                              <FileText size={21} />
                            ) : (
                              <ImageIcon size={21} />
                            )}
                            <span>
                              <strong>{proof.name}</strong>
                              <small>
                                {proof.type === "application/pdf"
                                  ? "PDF document"
                                  : "Image"}{" "}
                                · {Math.ceil(proof.size / 1024)} KB
                              </small>
                            </span>
                            <Eye size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="proof-preview">
                      {selected ? (
                        <>
                          <div className="proof-preview-heading">
                            <span>{selected.name}</span>
                            <a
                              href={fileUrl(selected)}
                              aria-label={`Download ${selected.name}`}
                            >
                              <Download size={17} />
                            </a>
                          </div>
                          {selected.type === "application/pdf" ? (
                            <object
                              key={selected.id}
                              data={fileUrl(selected, true)}
                              type="application/pdf"
                              aria-label={`Preview ${selected.name}`}
                            >
                              <p>
                                Your browser cannot display this PDF.{" "}
                                <a
                                  href={fileUrl(selected, true)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open PDF
                                </a>
                              </p>
                            </object>
                          ) : (
                            <img
                              key={selected.id}
                              src={fileUrl(selected, true)}
                              alt={selected.name}
                            />
                          )}
                          <a
                            className="proof-open-original"
                            href={fileUrl(selected, true)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open full size <Eye size={14} />
                          </a>
                        </>
                      ) : (
                        <p>Select a proof to preview it here.</p>
                      )}
                    </div>
                  </div>
                )}
              </section>
              <footer className="proof-dialog-footer">
                <span>
                  {busy
                    ? "Please wait while your proofs are saved."
                    : "Your uploaded proofs are saved automatically."}
                </span>
                <Button type="button" variant="outline" onClick={close}>
                  Done
                </Button>
              </footer>
            </div>
          </dialog>,
          document.body,
        )}
    </div>
  );
}
