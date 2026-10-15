"use client";
import { useRef, useState, type ChangeEvent } from "react";
import { FileText, ImageIcon, LoaderCircle, Paperclip } from "lucide-react";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
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
      {canEdit && (
        <>
          <input
            ref={input}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={upload}
            hidden
            aria-label={`Upload proofs for ${title}`}
            disabled={busy}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => input.current?.click()}
            disabled={busy || loading}
            aria-label={`Add proof for ${title}`}
          >
            {busy ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Paperclip size={15} />
            )}{" "}
            {busy ? "Uploading…" : "Add proof"}
          </Button>
          <small>Images & PDFs · Multiple files · 2 MB each</small>
        </>
      )}
      {loading && <p role="status">Loading proofs…</p>}
      {!!proofs.length && (
        <ul className="sustainability-proof-files">
          {proofs.map((proof) => (
            <li key={proof.id}>
              <a
                href={`${url}&file=${encodeURIComponent(proof.id)}`}
                target="_blank"
                rel="noreferrer"
                title={`Download ${proof.name}`}
              >
                {proof.type === "application/pdf" ? (
                  <FileText size={15} />
                ) : (
                  <ImageIcon size={15} />
                )}
                <span>{proof.name}</span>
                <small>{Math.ceil(proof.size / 1024)} KB</small>
              </a>
            </li>
          ))}
        </ul>
      )}
      <p role="status" className="sustainability-proof-status">
        {message}
      </p>
      {error && (
        <p role="alert" className="sustainability-proof-error">
          {error}
        </p>
      )}
    </div>
  );
}
