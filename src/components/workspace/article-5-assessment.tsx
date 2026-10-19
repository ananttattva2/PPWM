"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FileText,
  ShieldCheck,
  UploadCloud,
  X,
  Layers3,
  Check,
  Sparkles,
} from "lucide-react";
import styles from "./article-5-assessment.module.css";

const tabs = [
  "Scope & identity",
  "Material & construction",
  "Substances of concern",
  "Emissions, waste fate & microplastics",
  "Reuse & recycling interaction",
  "Heavy metals",
  "Food-contact gate",
  "PFAS detailed assessment",
] as const;

const scopeQuestions = [
  {
    id: 1,
    text: "Is this item a constituent of the packaging material or a packaging component of the assessed unit?",
    timeline: "12 Aug 2026",
  },
  {
    id: 2,
    text: "Has this component been given a unique ID that can be traced to the SKU, drawing and supplier material code?",
    timeline: "12 Aug 2026",
  },
  {
    id: 3,
    text: "Is the intended use of the component clearly defined?",
    timeline: "12 Aug 2026",
    timelineNote: "Food-contact and PFAS rule, where applicable",
    noGuidance:
      "Define the intended use before deciding food-contact/PFAS or life-cycle pathways.",
  },
  {
    id: 4,
    text: "Is the component composition known at the level needed for chemical/substance screening?",
    timeline: "12 Aug 2026",
  },
] as const;

const principalMaterialOptions = [
  "PET",
  "rPET",
  "PE",
  "PP",
  "HDPE",
  "LDPE",
  "PVC",
  "PS",
  "Paper/Cardboard",
  "Glass",
  "Steel",
  "Aluminium",
  "Wood",
  "Textile",
  "Composite/Multilayer",
  "Adhesive",
  "Ink/Coating",
  "Other",
  "Unknown",
] as const;

const constructionQuestions = [
  {
    id: 2,
    text: "Is the component homogeneous, or does it contain multiple layers/materials/formulations?",
    options: ["Homogeneous", "Multilayer", "Composite", "Formulated"],
  },
  {
    id: 3,
    text: "Are there coatings, lacquers, varnishes, barrier layers, surface treatments or functional layers?",
    options: ["Yes", "No", "Unknown", "N/A"],
  },
  {
    id: 4,
    text: "Are there adhesives, sealants, liners, gaskets, printing inks, primers, pigments or processing aids associated with this component?",
    options: ["Yes", "No", "Unknown", "N/A"],
  },
] as const;

export default function Article5Assessment({
  componentName,
  productName,
  material,
  backHref,
}: {
  componentName: string;
  productName: string;
  material: string;
  backHref: string;
}) {
  const id = useId();
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [evidence, setEvidence] = useState<Record<number, File>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [principalMaterial, setPrincipalMaterial] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [materialEvidence, setMaterialEvidence] = useState<File | null>(null);
  const [materialEvidenceError, setMaterialEvidenceError] = useState("");
  const [constructionAnswers, setConstructionAnswers] = useState<
    Record<number, string>
  >({});
  const [constructionDetails, setConstructionDetails] = useState<
    Record<number, string>
  >({});
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const answeredCount =
    active === 0
      ? Object.values(answers).filter(Boolean).length
      : active === 1
        ? Number(Boolean(principalMaterial)) +
          Object.values(constructionAnswers).filter(Boolean).length
        : 0;

  function choose(index: number) {
    setActive(index);
    tabRefs.current[index]?.focus();
  }

  function clearEvidence(questionId: number) {
    setEvidence((current) => {
      const updated = { ...current };
      delete updated[questionId];
      return updated;
    });
    setErrors((current) => {
      const updated = { ...current };
      delete updated[questionId];
      return updated;
    });
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            <ShieldCheck size={15} aria-hidden="true" /> ARTICLE 5 · SUBSTANCES
            IN PACKAGING
          </span>
          <h1>Article 5 assessment</h1>
          <p>
            Complete the substance requirements review for{" "}
            <strong>{componentName}</strong> in {productName}.
          </p>
          <div className={styles.heroTags}>
            <span>
              <Layers3 size={13} aria-hidden="true" /> Component assessment
            </span>
            <span>
              <CalendarDays size={13} aria-hidden="true" /> 12 Aug 2026
            </span>
          </div>
        </div>
        <Link href={backHref}>
          <ArrowLeft size={16} /> Back to Articles
        </Link>
      </header>

      <section className={styles.identity} aria-label="Assessment context">
        <span>
          <ShieldCheck size={20} />
        </span>
        <div>
          <small>COMPONENT</small>
          <b>{componentName}</b>
        </div>
        <div>
          <small>PRODUCT</small>
          <b>{productName}</b>
        </div>
        <div>
          <small>MATERIAL</small>
          <b>{material || "Not provided"}</b>
        </div>
      </section>

      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.navigationHeading}>
            <span>YOUR ASSESSMENT</span>
            <small>8 sections</small>
          </div>
          <nav
            className={styles.tabs}
            role="tablist"
            aria-label="Article 5 assessment sections"
            aria-orientation="vertical"
            onKeyDown={(event) => {
              if (
                ![
                  "ArrowRight",
                  "ArrowLeft",
                  "ArrowDown",
                  "ArrowUp",
                  "Home",
                  "End",
                ].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? tabs.length - 1
                    : ["ArrowRight", "ArrowDown"].includes(event.key)
                      ? (active + 1) % tabs.length
                      : (active - 1 + tabs.length) % tabs.length;
              choose(next);
            }}
          >
            {tabs.map((tab, index) => (
              <button
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                key={tab}
                type="button"
                role="tab"
                id={`${id}-tab-${index}`}
                aria-controls={`${id}-panel`}
                aria-selected={active === index}
                tabIndex={active === index ? 0 : -1}
                onClick={() => setActive(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{tab}</b>
                {active === index && (
                  <ArrowRight size={14} aria-hidden="true" />
                )}
              </button>
            ))}
          </nav>
          <div className={styles.sidebarNote}>
            <ShieldCheck size={21} aria-hidden="true" />
            <b>Build a clearer picture.</b>
            <p>
              Review each section and keep supporting specifications close at
              hand.
            </p>
          </div>
        </aside>

        <section
          key={active}
          className={styles.panel}
          role="tabpanel"
          id={`${id}-panel`}
          aria-labelledby={`${id}-tab-${active}`}
        >
          <div className={styles.sectionOverview}>
            <span>
              SECTION {String(active + 1).padStart(2, "0")} <i>/ 08</i>
            </span>
            {active < 2 && (
              <span>
                <Check size={14} aria-hidden="true" /> {answeredCount} of 4
                answered
              </span>
            )}
          </div>
          {active === 0 && (
            <div className={styles.scopeContent}>
              <header>
                <div>
                  <span>SCOPE ASSESSMENT</span>
                  <h2>Scope &amp; identity</h2>
                </div>
                <b className={styles.questionCount}>4 mandatory questions</b>
              </header>
              {scopeQuestions.map((question) => {
                const answer = answers[question.id] || "";
                const document = evidence[question.id];
                return (
                  <article className={styles.questionCard} key={question.id}>
                    <div className={styles.questionHeading}>
                      <span>{question.id}</span>
                      <div className={styles.questionCopy}>
                        <div className={styles.questionMeta}>
                          <b>Mandatory</b>
                          <span>EU market</span>
                        </div>
                        <h3>{question.text}</h3>
                      </div>
                      <div className={styles.timeline}>
                        <CalendarDays size={17} aria-hidden="true" />
                        <span>
                          <small>MANDATORY FROM</small>
                          <b>{question.timeline}</b>
                          {"timelineNote" in question && (
                            <em>{question.timelineNote}</em>
                          )}
                        </span>
                      </div>
                    </div>

                    <label className={styles.answerField}>
                      Answer <span aria-hidden="true">*</span>
                      <select
                        required
                        value={answer}
                        onChange={(event) => {
                          const value = event.target.value;
                          setAnswers((current) => ({
                            ...current,
                            [question.id]: value,
                          }));
                          if (value !== "Yes") clearEvidence(question.id);
                        }}
                      >
                        <option value="" disabled>
                          Select an answer
                        </option>
                        <option>Yes</option>
                        <option>No</option>
                        <option>Unknown</option>
                        <option>N/A</option>
                      </select>
                    </label>

                    {answer === "No" && "noGuidance" in question && (
                      <p className={styles.guidance} role="note">
                        <b>Action required:</b> {question.noGuidance}
                      </p>
                    )}

                    {answer === "Yes" && (
                      <div className={styles.evidenceSection}>
                        <div>
                          <h4>
                            Supporting evidence <span>Required</span>
                          </h4>
                          <p>
                            Upload a document that supports the selected answer.
                          </p>
                        </div>
                        {document ? (
                          <div className={styles.evidenceFile}>
                            <FileText size={21} aria-hidden="true" />
                            <span>
                              <b>{document.name}</b>
                              <small>
                                {(document.size / 1024).toFixed(1)} KB
                              </small>
                            </span>
                            <button
                              type="button"
                              aria-label={`Remove evidence for question ${question.id}`}
                              onClick={() => clearEvidence(question.id)}
                            >
                              <X size={17} />
                            </button>
                          </div>
                        ) : (
                          <label className={styles.evidenceUpload}>
                            <UploadCloud size={25} aria-hidden="true" />
                            <span>
                              <b>Upload evidence document</b>
                              <small>
                                PDF, DOC, DOCX, XLS, XLSX, PNG or JPG · Max 10
                                MB
                              </small>
                            </span>
                            <input
                              type="file"
                              required
                              accept=".pdf,.doc,.docx,.xls,.xlsx,image/png,image/jpeg"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (!file) return;
                                if (file.size > 10 * 1024 * 1024) {
                                  setErrors((current) => ({
                                    ...current,
                                    [question.id]:
                                      "Choose a document up to 10 MB.",
                                  }));
                                  event.target.value = "";
                                  return;
                                }
                                setEvidence((current) => ({
                                  ...current,
                                  [question.id]: file,
                                }));
                                setErrors((current) => {
                                  const updated = { ...current };
                                  delete updated[question.id];
                                  return updated;
                                });
                              }}
                            />
                          </label>
                        )}
                        {errors[question.id] && (
                          <p className={styles.error} role="alert">
                            {errors[question.id]}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {active === 1 && (
            <div className={styles.scopeContent}>
              <header>
                <div>
                  <span>MATERIAL ASSESSMENT</span>
                  <h2>Material &amp; construction</h2>
                </div>
                <b className={styles.questionCount}>4 mandatory questions</b>
              </header>
              <article className={styles.questionCard}>
                <div className={styles.questionHeading}>
                  <span>1</span>
                  <div className={styles.questionCopy}>
                    <div className={styles.questionMeta}>
                      <b>Mandatory</b>
                      <span>EU market</span>
                    </div>
                    <h3>What is the principal material of the component?</h3>
                  </div>
                  <div className={styles.timeline}>
                    <CalendarDays size={17} aria-hidden="true" />
                    <span>
                      <small>MANDATORY FROM</small>
                      <b>12 Aug 2026</b>
                    </span>
                  </div>
                </div>

                <label className={styles.answerField}>
                  Principal material <span aria-hidden="true">*</span>
                  <select
                    required
                    value={principalMaterial}
                    onChange={(event) => {
                      const value = event.target.value;
                      setPrincipalMaterial(value);
                      setMaterialEvidence(null);
                      setMaterialEvidenceError("");
                      if (value !== "Other" && value !== "Unknown")
                        setMaterialDescription("");
                    }}
                  >
                    <option value="" disabled>
                      Select the principal material
                    </option>
                    {principalMaterialOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                {(principalMaterial === "Other" ||
                  principalMaterial === "Unknown") && (
                  <>
                    <label className={styles.descriptionField}>
                      Describe the material <span aria-hidden="true">*</span>
                      <textarea
                        required
                        rows={4}
                        value={materialDescription}
                        onChange={(event) =>
                          setMaterialDescription(event.target.value)
                        }
                        placeholder="Describe the material, composition, grade, or any available supplier information."
                      />
                    </label>
                    <p className={styles.specificationNotice} role="note">
                      <b>Action required:</b> Describe the material and obtain
                      its specification before completing the assessment.
                    </p>
                  </>
                )}

                {principalMaterial && (
                  <div className={styles.evidenceSection}>
                    <div>
                      <h4>
                        Supporting evidence <span>Required</span>
                      </h4>
                      <p>
                        Upload the material specification or another document
                        that supports the selected principal material.
                      </p>
                    </div>
                    {materialEvidence ? (
                      <div className={styles.evidenceFile}>
                        <FileText size={21} aria-hidden="true" />
                        <span>
                          <b>{materialEvidence.name}</b>
                          <small>
                            {(materialEvidence.size / 1024).toFixed(1)} KB
                          </small>
                        </span>
                        <button
                          type="button"
                          aria-label="Remove material evidence"
                          onClick={() => {
                            setMaterialEvidence(null);
                            setMaterialEvidenceError("");
                          }}
                        >
                          <X size={17} />
                        </button>
                      </div>
                    ) : (
                      <label className={styles.evidenceUpload}>
                        <UploadCloud size={25} aria-hidden="true" />
                        <span>
                          <b>Upload evidence document</b>
                          <small>
                            PDF, DOC, DOCX, XLS, XLSX, PNG or JPG · Max 10 MB
                          </small>
                        </span>
                        <input
                          type="file"
                          required
                          accept=".pdf,.doc,.docx,.xls,.xlsx,image/png,image/jpeg"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            if (file.size > 10 * 1024 * 1024) {
                              setMaterialEvidenceError(
                                "Choose a document up to 10 MB.",
                              );
                              event.target.value = "";
                              return;
                            }
                            setMaterialEvidence(file);
                            setMaterialEvidenceError("");
                          }}
                        />
                      </label>
                    )}
                    {materialEvidenceError && (
                      <p className={styles.error} role="alert">
                        {materialEvidenceError}
                      </p>
                    )}
                  </div>
                )}
              </article>
              {constructionQuestions.map((question) => {
                const answer = constructionAnswers[question.id] || "";
                const separateScreening =
                  question.id === 2 &&
                  ["Multilayer", "Composite", "Formulated"].includes(answer);
                const identifyCoatings = question.id === 3 && answer === "Yes";
                return (
                  <article className={styles.questionCard} key={question.id}>
                    <div className={styles.questionHeading}>
                      <span>{question.id}</span>
                      <div className={styles.questionCopy}>
                        <div className={styles.questionMeta}>
                          <b>Mandatory</b>
                          <span>EU market</span>
                        </div>
                        <h3>{question.text}</h3>
                      </div>
                      <div className={styles.timeline}>
                        <CalendarDays size={17} aria-hidden="true" />
                        <span>
                          <small>MANDATORY FROM</small>
                          <b>12 Aug 2026</b>
                        </span>
                      </div>
                    </div>
                    <label className={styles.answerField}>
                      Answer <span aria-hidden="true">*</span>
                      <select
                        required
                        value={answer}
                        onChange={(event) => {
                          const value = event.target.value;
                          setConstructionAnswers((current) => ({
                            ...current,
                            [question.id]: value,
                          }));
                          setConstructionDetails((current) => ({
                            ...current,
                            [question.id]: "",
                          }));
                        }}
                      >
                        <option value="" disabled>
                          Select an answer
                        </option>
                        {question.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    {question.id === 2 && answer === "Homogeneous" && (
                      <p className={styles.guidance} role="note">
                        <b>Homogeneous:</b> One material screen.
                      </p>
                    )}
                    {separateScreening && (
                      <p className={styles.guidance} role="note">
                        <b>Separate screening required:</b> Identify every
                        relevant layer/formulation and screen separately.
                      </p>
                    )}
                    {identifyCoatings && (
                      <p className={styles.guidance} role="note">
                        <b>Action required:</b> Identify each layer and
                        chemistry.
                      </p>
                    )}
                    {question.id === 3 && answer === "No" && (
                      <p className={styles.guidance} role="note">
                        <b>Confirmation:</b> No coatings, lacquers, varnishes,
                        barrier layers, surface treatments or functional layers
                        declared.
                      </p>
                    )}
                    {(separateScreening || identifyCoatings) && (
                      <label className={styles.descriptionField}>
                        {separateScreening
                          ? "Layers / formulations to screen separately"
                          : "Layers and chemistry"}{" "}
                        <span aria-hidden="true">*</span>
                        <textarea
                          required
                          rows={4}
                          value={constructionDetails[question.id] || ""}
                          onChange={(event) =>
                            setConstructionDetails((current) => ({
                              ...current,
                              [question.id]: event.target.value,
                            }))
                          }
                          placeholder={
                            separateScreening
                              ? "List every relevant layer or formulation, including its material and composition, for separate screening."
                              : "Identify each coating, treatment or functional layer and its chemistry."
                          }
                        />
                      </label>
                    )}
                  </article>
                );
              })}
            </div>
          )}
          {active > 1 && (
            <div className={styles.emptySection}>
              <Sparkles size={30} aria-hidden="true" />
              <span>SECTION {String(active + 1).padStart(2, "0")}</span>
              <h2>{tabs[active]}</h2>
              <p>Questions for this section have not been added yet.</p>
              <button type="button" onClick={() => choose(1)}>
                Back to material &amp; construction <ArrowRight size={16} />
              </button>
            </div>
          )}
          {active < 2 && (
            <footer className={styles.sectionFooter}>
              <span>
                <ShieldCheck size={16} aria-hidden="true" /> Review answers and
                supporting evidence before continuing.
              </span>
              <button type="button" onClick={() => choose(active + 1)}>
                Next section <ArrowRight size={17} />
              </button>
            </footer>
          )}
        </section>
      </div>
    </main>
  );
}
