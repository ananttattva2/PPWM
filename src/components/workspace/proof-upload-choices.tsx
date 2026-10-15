"use client";
import { useRef, useState } from "react";
import { ArrowUp, FileText, ImagePlus, LoaderCircle } from "lucide-react";

export default function ProofUploadChoices({
  title,
  busy,
  onUpload,
}: {
  title: string;
  busy: boolean;
  onUpload: (files: File[]) => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  return (
    <div className="proof-upload-choices">
      <input
        ref={input}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,application/pdf"
        hidden
        disabled={busy}
        aria-label={`Upload proofs for ${title}`}
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          event.target.value = "";
          void onUpload(files);
        }}
      />
      {(["green", "red"] as const).map((theme, index) => (
        <section
          className={`proof-upload-choice proof-upload-choice-${theme}`}
          key={theme}
          aria-label={`${theme === "green" ? "Image" : "PDF"} proof upload`}
        >
          <header className="proof-choice-header">
            <span className="proof-choice-icon">
              {index === 0 ? <ImagePlus /> : <FileText />}
            </span>
            <div>
              <h3>
                Upload <em>Files</em>
              </h3>
              <p>Upload images or PDF documents</p>
            </div>
            <span className="proof-size-badge">
              <FileText size={18} />
              Max size: 10 MB
            </span>
          </header>
          <div
            className={`proof-choice-drop ${dragging === theme ? "proof-choice-dragging" : ""}`}
            aria-label={`${theme} drop zone`}
            onDragOver={(event) => {
              event.preventDefault();
              if (!busy) setDragging(theme);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node))
                setDragging(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(null);
              void onUpload(Array.from(event.dataTransfer.files));
            }}
          >
            <svg className="proof-marching-border" aria-hidden="true">
              <rect x="1" y="1" rx="18" />
            </svg>
            <div className="proof-choice-art" aria-hidden="true">
              <span className="proof-choice-halo" />
              <span className="proof-choice-leaf proof-choice-leaf-left" />
              <span className="proof-choice-leaf proof-choice-leaf-right" />
              <span className="proof-art-photo">
                <span className="proof-photo-sun" />
                <span className="proof-photo-mountain" />
              </span>
              <span className="proof-art-pdf">
                <span className="proof-pdf-fold" />
                <svg viewBox="0 0 80 80" fill="none">
                  <path
                    d="M41 10c-10 8 2 30 15 40 10 8 17 2 9-3-12-7-33-3-45 6C3 66 8 77 20 62c11-13 24-38 23-48-1-7-5-7-6-1"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
                <b>PDF</b>
              </span>
              <span className="proof-art-upload">
                {busy ? <LoaderCircle className="animate-spin" /> : <ArrowUp />}
              </span>
              <span className="proof-choice-spark proof-choice-spark-one" />
              <span className="proof-choice-spark proof-choice-spark-two" />
            </div>
            <h4>
              {busy
                ? "Uploading your files…"
                : dragging === theme
                  ? "Drop your files here"
                  : "Drag & drop images or PDFs here"}
            </h4>
            <p className="proof-choice-browse">
              or{" "}
              <button
                type="button"
                disabled={busy}
                onClick={() => input.current?.click()}
              >
                click to browse
              </button>
            </p>
            <p className="proof-choice-help">
              You can upload multiple files (JPG, JPEG, PNG, WebP, PDF)
            </p>
          </div>
          <footer className="proof-type-badges">
            {["JPG", "JPEG", "PNG", "WebP", "PDF"].map((type) => (
              <span
                key={type}
                className={type === "PDF" ? "proof-type-pdf" : ""}
              >
                <FileText />
                {type}
              </span>
            ))}
          </footer>
        </section>
      ))}
      <span className="proof-choice-divider" aria-hidden="true">
        <span>OR</span>
      </span>
    </div>
  );
}
