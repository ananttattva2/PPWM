"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, FileText, PackageCheck, UploadCloud, X } from "lucide-react";
import styles from "./sku-level-assessment.module.css";

const sections = [
  { name: "Scope & identity", question: "Is the item within the PPWR definition of packaging under Article 3(1)(1)?" },
  { name: "Material & construction", question: "Can the conceptual design, manufacturing drawings and materials of components be linked to this assessment?" },
  { name: "Reuse & recycling interaction", question: "Could interactions between components increase a substance-related concern compared with assessing each component alone?" },
] as const;

const options = ["Yes", "No", "Unknown", "N/A"] as const;

export default function SkuLevelAssessment({ productName, sku, backHref }: { productName: string; sku: string; backHref: string }) {
  const id = useId();
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [files, setFiles] = useState<Record<number, File | undefined>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const answer = answers[active] || "";
  const file = files[active];
  const needsEvidence = answer === "Yes" || answer === "No";

  function choose(index: number) {
    setActive(index);
    tabRefs.current[index]?.focus();
  }

  function clearFile(index: number) {
    setFiles((current) => ({ ...current, [index]: undefined }));
    setErrors((current) => ({ ...current, [index]: "" }));
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><span>SKU ANALYSE · PACKAGING ASSESSMENT</span><h1>SKU-level assessment</h1><p>Review the complete packaging configuration for <strong>{productName}</strong>.</p></div>
        <Link href={backHref}><ArrowLeft size={16} /> Back to SKU overview</Link>
      </header>

      <section className={styles.context} aria-label="SKU assessment context">
        <span><PackageCheck size={22} /></span>
        <div><small>PRODUCT</small><b>{productName}</b></div>
        <div><small>SKU</small><b>{sku || "Not provided"}</b></div>
        <div><small>ASSESSMENT</small><b>Complete packaging unit</b></div>
      </section>

      <nav className={styles.tabs} role="tablist" aria-label="SKU assessment sections" onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        choose(event.key === "Home" ? 0 : event.key === "End" ? 2 : event.key === "ArrowRight" ? (active + 1) % 3 : (active + 2) % 3);
      }}>
        {sections.map((section, index) => (
          <button key={section.name} ref={(node) => { tabRefs.current[index] = node; }} type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={active === index} aria-controls={`${id}-panel`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)}>
            <span>{String(index + 1).padStart(2, "0")}</span>{section.name}
          </button>
        ))}
      </nav>

      <section className={styles.panel} role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`}>
        <header><div><span>QUESTION 01</span><h2>{sections[active].name}</h2></div><b>1 mandatory question</b></header>
        <article className={styles.question}>
          <div className={styles.questionHeading}>
            <span>1</span>
            <div className={styles.copy}><div className={styles.badges}><b>Mandatory</b><em>EU market</em></div><h3>{sections[active].question}</h3></div>
            <div className={styles.timeline}><CalendarDays size={18} /><span><small>MANDATORY FROM</small><b>12 Aug 2026</b></span></div>
          </div>
          <label className={styles.answer}>Answer <i>*</i>
            <select required value={answer} onChange={(event) => {
              const value = event.target.value;
              setAnswers((current) => ({ ...current, [active]: value }));
              if (value !== "Yes" && value !== "No") clearFile(active);
            }}>
              <option value="" disabled>Select an answer</option>
              {options.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          {needsEvidence && (
            <div className={styles.evidence}>
              <div><h4>Supporting evidence <span>Required</span></h4><p>Upload a document supporting the selected answer.</p></div>
              {file ? (
                <div className={styles.file}><FileText size={22} /><span><b>{file.name}</b><small>{(file.size / 1024).toFixed(1)} KB</small></span><button type="button" aria-label="Remove evidence" onClick={() => clearFile(active)}><X size={17} /></button></div>
              ) : (
                <label className={styles.upload}><UploadCloud size={26} /><span><b>Upload evidence document</b><small>PDF, DOC, DOCX, XLS, XLSX, PNG or JPG · Max 10 MB</small></span><input required type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,image/png,image/jpeg" onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (!selected) return;
                  if (selected.size > 10 * 1024 * 1024) {
                    setErrors((current) => ({ ...current, [active]: "Choose a document up to 10 MB." }));
                    event.target.value = "";
                    return;
                  }
                  setFiles((current) => ({ ...current, [active]: selected }));
                  setErrors((current) => ({ ...current, [active]: "" }));
                }} /></label>
              )}
              {errors[active] && <p className={styles.error} role="alert">{errors[active]}</p>}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
