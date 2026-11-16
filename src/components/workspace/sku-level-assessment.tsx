"use client";
import { persistAssessmentFile } from "@/lib/upload-media-client";
import { mediaAccept } from "@/lib/media-types";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  PackageCheck,
  UploadCloud,
  X,
} from "lucide-react";
import styles from "./sku-level-assessment.module.css";

const sections = [
  {
    name: "Scope & identity",
    question:
      "Is the item within the PPWR definition of packaging under Article 3(1)(1)?",
  },
] as const;

const packagingDefinitions = [
  [
    "Main packaging",
    "An item used to contain, protect, support or preserve a product during its life, which is not an integral part of the product and is intended to be used or disposed of with it.",
  ],
  [
    "Integrated packaging component",
    "A component that forms part of the main packaging itself.",
  ],
  [
    "Attached packaging element",
    "An item attached to or hung directly on the product that performs a packaging function but is not an integral part of the product.",
  ],
  [
    "Service packaging",
    "Packaging designed to be filled at the point of sale to provide or dispense a product.",
  ],
  [
    "Disposable point-of-sale item",
    "A disposable item sold and filled, or intended to be filled, at the point of sale that performs a packaging function.",
  ],
  [
    "Permeable beverage bags or soft pods",
    "Tea, coffee or similar beverage bags or soft single-serve units that contain the product, allow liquid to pass through where applicable, and are disposed of with the product after use.",
  ],
  [
    "Non-permeable beverage capsules",
    "Single-serve tea, coffee or similar beverage units used in a machine and disposed of with the product after use.",
  ],
] as const;

export default function SkuLevelAssessment({
  productName,
  sku,
  backHref,
}: {
  productName: string;
  sku: string;
  backHref: string;
}) {
  const id = useId();
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [classifications, setClassifications] = useState<
    Record<number, string>
  >({});
  const [files, setFiles] = useState<Record<number, File | undefined>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const answer = answers[active] || "";
  const classification = classifications[active] || "";
  const selectedDefinition = packagingDefinitions.find(
    ([name]) => name === classification,
  );
  const file = files[active];
  const needsEvidence = answer === "No" || Boolean(selectedDefinition);

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
        <div>
          <span>SKU ANALYSE · PACKAGING ASSESSMENT</span>
          <h1>SKU-level assessment</h1>
          <p>
            Review the complete packaging configuration for{" "}
            <strong>{productName}</strong>.
          </p>
        </div>
        <Link href={backHref}>
          <ArrowLeft size={16} /> Back to Articles
        </Link>
      </header>

      <section className={styles.context} aria-label="SKU assessment context">
        <span>
          <PackageCheck size={22} />
        </span>
        <div>
          <small>PRODUCT</small>
          <b>{productName}</b>
        </div>
        <div>
          <small>SKU</small>
          <b>{sku || "Not provided"}</b>
        </div>
        <div>
          <small>ASSESSMENT</small>
          <b>Complete packaging unit</b>
        </div>
      </section>

      <nav
        className={styles.tabs}
        role="tablist"
        aria-label="SKU assessment sections"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          choose(
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? sections.length - 1
                : event.key === "ArrowRight"
                  ? (active + 1) % sections.length
                  : (active - 1 + sections.length) % sections.length,
          );
        }}
      >
        {sections.map((section, index) => (
          <button
            key={section.name}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-selected={active === index}
            aria-controls={`${id}-panel`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {section.name}
          </button>
        ))}
      </nav>

      <section
        className={styles.panel}
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
      >
        <header>
          <div>
            <span>QUESTION 01</span>
            <h2>{sections[active].name}</h2>
          </div>
          <b>1 mandatory question</b>
        </header>
        <article className={styles.question}>
          <div className={styles.questionHeading}>
            <span>1</span>
            <div className={styles.copy}>
              <div className={styles.badges}>
                <b>Mandatory</b>
                <em>EU market</em>
              </div>
              <h3>{sections[active].question}</h3>
            </div>
            <div className={styles.timeline}>
              <CalendarDays size={18} />
              <span>
                <small>MANDATORY FROM</small>
                <b>12 Aug 2026</b>
              </span>
            </div>
          </div>
          <label className={styles.answer}>
            Answer <i>*</i>
            <select
              required
              value={answer}
              onChange={(event) => {
                const value = event.target.value;
                if (value !== answer) clearFile(active);
                setAnswers((current) => ({ ...current, [active]: value }));
                if (value !== "Yes")
                  setClassifications((current) => ({
                    ...current,
                    [active]: "",
                  }));
              }}
            >
              <option value="" disabled>
                Select an answer
              </option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </label>
          {answer === "Yes" && (
            <label className={styles.answer}>
              Packaging type <i>*</i>
              <select
                required
                value={classification}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value !== classification) clearFile(active);
                  setClassifications((current) => ({
                    ...current,
                    [active]: value,
                  }));
                }}
              >
                <option value="" disabled>
                  Select the applicable packaging type
                </option>
                {packagingDefinitions.map(([name]) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {selectedDefinition && (
            <div className={styles.selectedDefinition}>
              <b>{selectedDefinition[0]}</b>
              <p>{selectedDefinition[1]}</p>
            </div>
          )}
          {needsEvidence && (
            <div className={styles.evidence}>
              <div>
                <h4>
                  Supporting evidence <span>Required</span>
                </h4>
                <p>Upload a document supporting the selected answer.</p>
              </div>
              {file ? (
                <div className={styles.file}>
                  <FileText size={22} />
                  <span>
                    <b>{file.name}</b>
                    <small>{(file.size / 1024).toFixed(1)} KB</small>
                  </span>
                  <button
                    type="button"
                    aria-label="Remove evidence"
                    onClick={() => clearFile(active)}
                  >
                    <X size={17} />
                  </button>
                </div>
              ) : (
                <label className={styles.upload}>
                  <UploadCloud size={26} />
                  <span>
                    <b>Upload evidence document</b>
                    <small>
                      PDF, DOC, DOCX, XLS, XLSX, PNG or JPG · Max 10 MB
                    </small>
                  </span>
                  <input
                    required
                    type="file"
                    accept={mediaAccept}
                    onChange={async (event) => {
                      const selected = event.target.files?.[0];
                      if (!selected) return;
                      if (selected.size > 10 * 1024 * 1024) {
                        setErrors((current) => ({
                          ...current,
                          [active]: "Choose a document up to 10 MB.",
                        }));
                        event.target.value = "";
                        return;
                      }
                      try {
                        await persistAssessmentFile(
                          selected,
                          event.currentTarget
                            .closest("article")
                            ?.querySelector("h3")?.textContent ||
                            "assessment evidence",
                        );
                      } catch {
                        return;
                      }
                      setFiles((current) => ({
                        ...current,
                        [active]: selected,
                      }));
                      setErrors((current) => ({ ...current, [active]: "" }));
                    }}
                  />
                </label>
              )}
              {errors[active] && (
                <p className={styles.error} role="alert">
                  {errors[active]}
                </p>
              )}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
