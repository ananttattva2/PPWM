"use client";
import { persistAssessmentFile } from "@/lib/upload-media-client";
import { mediaAccept } from "@/lib/media-types";

import { useDraftState } from "@/lib/use-draft-state";
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
} from "lucide-react";
import styles from "./article-5-assessment.module.css";
import HeavyMetalsAssessment from "./heavy-metals-assessment";

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

type ConcernQuestion = {
  id: number;
  text: string;
  options: readonly string[];
  evidenceAnswers: readonly string[];
  guidance?: Partial<Record<string, string>>;
};

const standardConcernOptions = ["Yes", "No", "Unknown", "N/A"] as const;

const concernQuestions: ConcernQuestion[] = [
  {
    id: 1,
    text: "Have intentionally added substances beyond the base material been identified?",
    options: standardConcernOptions,
    evidenceAnswers: ["Yes"],
    guidance: { No: "Obtain a substantiating declaration." },
  },
  {
    id: 2,
    text: "Are plasticisers, stabilisers, antioxidants, UV stabilisers, flame retardants, pigments, dyes, slip agents, lubricants, processing aids or similar additives present?",
    options: standardConcernOptions,
    evidenceAnswers: ["Yes"],
    guidance: {
      No: "Document supplier confirmation.",
      Unknown: "Escalate this evidence gap for review.",
    },
  },
  {
    id: 3,
    text: "Are any substances of concern known or reasonably expected to be present?",
    options: standardConcernOptions,
    evidenceAnswers: ["Yes", "No"],
    guidance: {
      No: "Retain the evidence supporting the negative conclusion.",
      Unknown:
        "Evidence gap: obtain sufficient information before completing the assessment.",
    },
  },
  {
    id: 4,
    text: "For each identified substance of concern, is the substance identity known?",
    options: standardConcernOptions,
    evidenceAnswers: ["Yes"],
    guidance: { No: "Obtain sufficient identity information." },
  },
  {
    id: 5,
    text: "For each identified substance of concern, is its concentration or concentration range known?",
    options: standardConcernOptions,
    evidenceAnswers: ["Yes"],
    guidance: { No: "Obtain suitable evidence." },
  },
  {
    id: 6,
    text: "Is the substance intentionally added, present as an impurity/residual, or generated during processing/use?",
    options: [
      "Intentionally added",
      "Impurity / residual",
      "Generated during processing/use",
      "Multiple sources",
      "Unknown",
      "N/A",
    ],
    evidenceAnswers: [
      "Intentionally added",
      "Impurity / residual",
      "Generated during processing/use",
      "Multiple sources",
      "Unknown",
      "N/A",
    ],
  },
  {
    id: 7,
    text: "Has reduction or substitution potential been considered for an identified substance of concern?",
    options: standardConcernOptions,
    evidenceAnswers: ["Yes", "No"],
  },
  {
    id: 8,
    text: "Is the substance subject to another applicable Union restriction or specific measure relevant to the packaging/use?",
    options: standardConcernOptions,
    evidenceAnswers: ["Yes", "No"],
  },
];

type EmissionQuestion = {
  id: number;
  text: string;
  guidance: Partial<Record<string, string>>;
  detailLabels: Partial<Record<string, string>>;
};

const emissionQuestions: EmissionQuestion[] = [
  {
    id: 1,
    text: "Could the substance be released or contribute to emissions during manufacture, filling, use, cleaning, transport or storage?",
    guidance: {
      Yes: "Characterise pathway/potential impact.",
      No: "Document rationale.",
    },
    detailLabels: {
      Yes: "Release pathway and potential impact",
      No: "Rationale for no release or emissions",
    },
  },
  {
    id: 2,
    text: "Could the substance or its transformation products remain in waste-management outputs such as secondary raw materials, ashes or other material for final disposal?",
    guidance: {
      Yes: "Characterise pathway/potential impact.",
      No: "Document rationale.",
    },
    detailLabels: {
      Yes: "Waste-management pathway and potential impact",
      No: "Rationale for no remaining substance or transformation products",
    },
  },
  {
    id: 3,
    text: "Could the packaging/component contribute to microplastic release through abrasion, fragmentation, weathering, mechanical stress or disposal pathways?",
    guidance: {
      Yes: "Assess pathway and supporting evidence.",
      Unknown: "Assess pathway and supporting evidence.",
      No: "Document basis.",
    },
    detailLabels: {
      Yes: "Microplastic release pathway assessment",
      Unknown: "Pathway assessment and evidence gaps",
      No: "Basis for no microplastic release",
    },
  },
  {
    id: 4,
    text: "Could coatings, labels, additives or surface treatments increase fragmentation, shedding or persistence at end-of-life?",
    guidance: {
      Yes: "Identify mechanism and mitigation.",
      Unknown: "Obtain information.",
    },
    detailLabels: {
      Yes: "Mechanism and mitigation",
      Unknown: "Information needed and follow-up actions",
    },
  },
  {
    id: 5,
    text: "Has an EU or Member State process identified this substance as negatively affecting reuse/recycling or proposed a relevant restriction?",
    guidance: {
      Yes: "Legal impact assessment/re-assessment.",
      No: "Record monitoring date.",
    },
    detailLabels: { Yes: "Legal impact assessment / re-assessment" },
  },
];

const reuseRecyclingQuestions: ConcernQuestion[] = [
  {
    id: 1,
    text: "Could any identified substance negatively affect re-use or recycling of materials in the packaging where it is present?",
    options: standardConcernOptions,
    evidenceAnswers: ["Yes", "No"],
  },
  {
    id: 2,
    text: "Could the substance interfere with sorting, detection, separation, washing, reprocessing or the quality of recycled material?",
    options: standardConcernOptions,
    evidenceAnswers: ["Yes", "No"],
  },
  {
    id: 3,
    text: "Could the substance accumulate or concentrate in recycled material and create a downstream concern?",
    options: standardConcernOptions,
    evidenceAnswers: ["Yes", "No"],
  },
  {
    id: 4,
    text: "After screening, can you support the conclusion that presence and concentration of substances of concern are minimised?",
    options: standardConcernOptions,
    evidenceAnswers: ["Yes", "No"],
  },
];

const foodContactQuestions: ConcernQuestion[] = [
  {
    id: 1,
    text: "Is the packaging intended for food contact?",
    options: [
      "Yes – direct food contact",
      "Yes – indirect/contact-sensitive",
      "No",
      "Unknown",
    ],
    evidenceAnswers: [
      "Yes – direct food contact",
      "Yes – indirect/contact-sensitive",
      "No",
      "Unknown",
    ],
  },
  {
    id: 2,
    text: "Is the relevant placing-on-market date on or after 12 August 2026?",
    options: ["On / after 12-Aug-2026", "Before 12-Aug-2026", "Unknown"],
    evidenceAnswers: [],
    guidance: {
      "On / after 12-Aug-2026": "Apply Article 5(5) PFAS limits.",
      "Before 12-Aug-2026":
        "Retain the historical basis; this assessment does not back-date the requirement.",
    },
  },
  {
    id: 3,
    text: "Is placing this packaging on the market already prohibited or restricted by another Union legal act in a way that affects the PFAS assessment?",
    options: standardConcernOptions,
    evidenceAnswers: ["Yes", "No", "Unknown", "N/A"],
  },
];

const pfasQuestions: {
  text: string;
  guidance: Partial<Record<string, string>>;
}[] = [
  {
    text: "Has PFAS screening covered the packaging and relevant components, including coatings, barrier layers, adhesives, seals, inks and treatments?",
    guidance: {
      Yes: "Record method/scope.",
      No: "Complete screening.",
      Unknown: "Complete screening.",
    },
  },
  {
    text: "Has targeted PFAS analysis been performed with polymeric PFAS excluded from quantification as specified?",
    guidance: {
      Yes: "Continue.",
      No: "Obtain suitable evidence.",
      Unknown: "Obtain suitable evidence.",
    },
  },
  {
    text: "Is any individual PFAS at or above 25 ppb?",
    guidance: {
      Yes: "FAIL 5(5)(a).",
      No: "Continue.",
      Unknown: "Evidence gap.",
    },
  },
  {
    text: "Has the sum of PFAS been assessed using targeted PFAS analysis, with prior degradation of precursors where applicable and polymeric PFAS excluded from quantification?",
    guidance: {
      Yes: "Continue.",
      No: "Obtain suitable evidence.",
      Unknown: "Obtain suitable evidence.",
    },
  },
  {
    text: "Is the sum of targeted PFAS at or above 250 ppb?",
    guidance: {
      Yes: "FAIL 5(5)(b).",
      No: "Continue.",
      Unknown: "Evidence gap.",
    },
  },
  {
    text: "Has total fluorine been measured/assessed to determine whether the total-PFAS criterion and fluorine evidence trigger need to be considered?",
    guidance: {
      Yes: "Continue.",
      No: "Obtain appropriate evidence where relevant.",
      Unknown: "Obtain appropriate evidence where relevant.",
    },
  },
  {
    text: "Is PFAS concentration including polymeric PFAS at or above 50 ppm?",
    guidance: {
      Yes: "FAIL 5(5)(c).",
      No: "Continue.",
      Unknown: "Evidence gap.",
    },
  },
  {
    text: "Does total fluorine exceed 50 mg/kg?",
    guidance: {
      Yes: "Obtain proof of the quantity of fluorine measured as PFAS vs non-PFAS for Annex VII.",
      No: "Record basis.",
    },
  },
  {
    text: "Where total fluorine exceeds 50 mg/kg, has the requested PFAS vs non-PFAS fluorine proof been obtained?",
    guidance: { Yes: "Add to technical file.", No: "Evidence gap." },
  },
  {
    text: "Are PFAS intentionally used for grease, oil, water, stain, barrier or another functional purpose?",
    guidance: {
      Yes: "Identify function and quantify.",
      No: "Retain negative declaration.",
      Unknown: "Investigate.",
    },
  },
  {
    text: "Could PFAS be introduced indirectly through recycled feedstock, processing aids, coatings, adhesives or conversion operations?",
    guidance: {
      Yes: "Trace source and seek evidence.",
      Unknown: "Trace source and seek evidence.",
      No: "Document supply-chain assessment.",
    },
  },
  {
    text: "After PFAS assessment, can the packaging be concluded to meet all applicable Article 5(5) thresholds and evidence requirements?",
    guidance: {
      Yes: "PFAS PASS.",
      No: "FAIL + corrective action.",
      Unknown: "Evidence gap.",
    },
  },
];

function EvidenceProof({
  questionId,
  file,
  onChange,
}: {
  questionId: number;
  file?: File;
  onChange: (file?: File) => void;
}) {
  const [error, setError] = useState("");
  return (
    <div className={styles.evidenceSection}>
      <div>
        <h4>
          Supporting evidence <span>Required</span>
        </h4>
        <p>Upload a document supporting this selected answer.</p>
      </div>
      {file ? (
        <div className={styles.evidenceFile}>
          <FileText size={21} aria-hidden="true" />
          <span>
            <b>{file.name}</b>
            <small>{(file.size / 1024).toFixed(1)} KB</small>
          </span>
          <button
            type="button"
            aria-label={`Remove material evidence for question ${questionId}`}
            onClick={() => {
              onChange();
              setError("");
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
            <small>PDF, DOC, DOCX, XLS, XLSX, PNG or JPG · Max 10 MB</small>
          </span>
          <input
            type="file"
            required
            aria-label={`Supporting evidence for question ${questionId}`}
            accept={mediaAccept}
            onChange={async (event) => {
              const selected = event.target.files?.[0];
              if (!selected) return;
              if (selected.size > 10 * 1024 * 1024) {
                setError("Choose a document up to 10 MB.");
                event.target.value = "";
                return;
              }
              try {
                await persistAssessmentFile(
                  selected,
                  event.currentTarget.closest("article")?.querySelector("h3")
                    ?.textContent || "assessment evidence",
                );
              } catch {
                return;
              }
              setError("");
              onChange(selected);
            }}
          />
        </label>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

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
  const [heavyAnsweredCount, setHeavyAnsweredCount] = useDraftState(
    "heavyAnsweredCount",
    0,
  );
  const [pfasAnswers, setPfasAnswers] = useDraftState<Record<number, string>>(
    "pfasAnswers",
    {},
  );
  const [pfasDetails, setPfasDetails] = useDraftState<Record<number, string>>(
    "pfasDetails",
    {},
  );
  const [pfasProofs, setPfasProofs] = useDraftState<
    Record<number, File | undefined>
  >("pfasProofs", {});
  const pfasConflict =
    pfasAnswers[12] === "Yes" &&
    [3, 5, 7].some((number) => pfasAnswers[number] === "Yes");
  const [active, setActive] = useDraftState("active", 0);
  const [answers, setAnswers] = useDraftState<Record<number, string>>(
    "answers",
    {},
  );
  const [evidence, setEvidence] = useDraftState<Record<number, File>>(
    "evidence",
    {},
  );
  const [errors, setErrors] = useDraftState<Record<number, string>>(
    "errors",
    {},
  );
  const [principalMaterial, setPrincipalMaterial] = useDraftState(
    "principalMaterial",
    "",
  );
  const [materialDescription, setMaterialDescription] = useDraftState(
    "materialDescription",
    "",
  );
  const [materialEvidence, setMaterialEvidence] = useDraftState<File | null>(
    "materialEvidence",
    null,
  );
  const [materialEvidenceError, setMaterialEvidenceError] = useDraftState(
    "materialEvidenceError",
    "",
  );
  const [constructionProofs, setConstructionProofs] = useDraftState<
    Record<number, File | undefined>
  >("constructionProofs", {});
  const [constructionAnswers, setConstructionAnswers] = useDraftState<
    Record<number, string>
  >("constructionAnswers", {});
  const [constructionDetails, setConstructionDetails] = useDraftState<
    Record<number, string>
  >("constructionDetails", {});
  const [concernAnswers, setConcernAnswers] = useDraftState<
    Record<number, string>
  >("concernAnswers", {});
  const [concernProofs, setConcernProofs] = useDraftState<
    Record<number, File | undefined>
  >("concernProofs", {});
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [emissionAnswers, setEmissionAnswers] = useDraftState<
    Record<number, string>
  >("emissionAnswers", {});
  const [emissionDetails, setEmissionDetails] = useDraftState<
    Record<number, string>
  >("emissionDetails", {});
  const [emissionProofs, setEmissionProofs] = useDraftState<
    Record<number, File | undefined>
  >("emissionProofs", {});
  const [monitoringDate, setMonitoringDate] = useDraftState(
    "monitoringDate",
    "",
  );
  const [reuseAnswers, setReuseAnswers] = useDraftState<Record<number, string>>(
    "reuseAnswers",
    {},
  );
  const [reuseProofs, setReuseProofs] = useDraftState<
    Record<number, File | undefined>
  >("reuseProofs", {});
  const [foodContactAnswers, setFoodContactAnswers] = useDraftState<
    Record<number, string>
  >("foodContactAnswers", {});
  const [foodContactProofs, setFoodContactProofs] = useDraftState<
    Record<number, File | undefined>
  >("foodContactProofs", {});
  const answeredCount =
    active === 0
      ? Object.values(answers).filter(Boolean).length
      : active === 1
        ? Number(Boolean(principalMaterial)) +
          Object.values(constructionAnswers).filter(Boolean).length
        : active === 2
          ? Object.values(concernAnswers).filter(Boolean).length
          : active === 3
            ? Object.values(emissionAnswers).filter(Boolean).length
            : active === 4
              ? Object.values(reuseAnswers).filter(Boolean).length
              : active === 6
                ? Object.values(foodContactAnswers).filter(Boolean).length
                : 0;

  const panel = useRef<HTMLElement>(null);
  const [completed, setCompleted] = useDraftState<boolean[]>("completed", []);
  const [navigationError, setNavigationError] = useState("");
  function choose(index: number) {
    if (index > active + 1) return;
    if (index > active) {
      if (
        Array.from({ length: active }, (_, i) => i).some((i) => !completed[i])
      )
        return;
      const fields = panel.current?.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("input[required],select[required],textarea[required]");
      const invalid = Array.from(fields || []).find(
        (field) =>
          !field.closest("[hidden]") &&
          (!field.checkValidity() ||
            (field.tagName === "TEXTAREA" && !field.value.trim())),
      );
      if (invalid) {
        setNavigationError(
          "Complete all mandatory answers, details and evidence before continuing.",
        );
        invalid.reportValidity();
        invalid.focus();
        return;
      }
      setCompleted((current) =>
        current
          .map((value, i) => (i === active ? true : value))
          .concat(Array(Math.max(0, active + 1 - current.length)).fill(true)),
      );
    }
    setNavigationError("");
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
        <div className={styles.heroArt} aria-hidden="true">
          <span className={styles.heroOrb} />
          <span className={styles.heroLeaf} />
          <span className={styles.heroLeafSecond} />
          <img
            src="/images/materials/bottle-splash.webp"
            alt=""
            width={720}
            height={720}
          />
        </div>
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
            aria-orientation="horizontal"
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
                disabled={
                  index > active + 1 ||
                  (index > active &&
                    Array.from({ length: active }, (_, i) => i).some(
                      (i) => !completed[i],
                    ))
                }
                onClick={() => choose(index)}
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
          ref={panel}
          onChangeCapture={() => {
            setCompleted((current) =>
              current.map((done, index) => (index >= active ? false : done)),
            );
          }}
          className={styles.panel}
          role="tabpanel"
          id={`${id}-panel`}
          aria-labelledby={`${id}-tab-${active}`}
        >
          {navigationError && (
            <p role="alert" className={styles.error}>
              {navigationError}
            </p>
          )}
          <div className={styles.sectionOverview}>
            <span>
              SECTION {String(active + 1).padStart(2, "0")} <i>/ 08</i>
            </span>
            {active <= 7 && (
              <span>
                <Check size={14} aria-hidden="true" />{" "}
                {active === 7
                  ? Object.values(pfasAnswers).filter(Boolean).length
                  : active === 5
                    ? heavyAnsweredCount
                    : answeredCount}{" "}
                of{" "}
                {active === 7
                  ? 12
                  : active === 5
                    ? 11
                    : active === 2
                      ? 8
                      : active === 3
                        ? 5
                        : active === 6
                          ? 3
                          : 4}{" "}
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
                              accept={mediaAccept}
                              onChange={async (event) => {
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
                                try {
                                  await persistAssessmentFile(
                                    file,
                                    event.currentTarget
                                      .closest("article")
                                      ?.querySelector("h3")?.textContent ||
                                      "assessment evidence",
                                  );
                                } catch {
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
                          accept={mediaAccept}
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            if (file.size > 10 * 1024 * 1024) {
                              setMaterialEvidenceError(
                                "Choose a document up to 10 MB.",
                              );
                              event.target.value = "";
                              return;
                            }
                            try {
                              await persistAssessmentFile(
                                file,
                                event.currentTarget
                                  .closest("article")
                                  ?.querySelector("h3")?.textContent ||
                                  "assessment evidence",
                              );
                            } catch {
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
                          setConstructionProofs((current) => ({
                            ...current,
                            [question.id]: undefined,
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
                    {answer && (
                      <EvidenceProof
                        key={`${question.id}-${answer}`}
                        questionId={question.id}
                        file={constructionProofs[question.id]}
                        onChange={(file) =>
                          setConstructionProofs((current) => ({
                            ...current,
                            [question.id]: file,
                          }))
                        }
                      />
                    )}
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
          {active === 2 && (
            <div className={styles.scopeContent}>
              <header>
                <div>
                  <span>SUBSTANCE ASSESSMENT</span>
                  <h2>Substances of concern</h2>
                </div>
                <b className={styles.questionCount}>8 mandatory questions</b>
              </header>
              {concernQuestions.map((question) => {
                const answer = concernAnswers[question.id] || "";
                const guidance = question.guidance?.[answer];
                const requiresEvidence =
                  question.evidenceAnswers.includes(answer);
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
                          setConcernAnswers((current) => ({
                            ...current,
                            [question.id]: value,
                          }));
                          if (!question.evidenceAnswers.includes(value)) {
                            setConcernProofs((current) => ({
                              ...current,
                              [question.id]: undefined,
                            }));
                          }
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

                    {guidance && (
                      <p className={styles.guidance} role="note">
                        <b>Action required:</b> {guidance}
                      </p>
                    )}

                    {requiresEvidence && (
                      <EvidenceProof
                        key={`${question.id}-${answer}`}
                        questionId={question.id}
                        file={concernProofs[question.id]}
                        onChange={(file) =>
                          setConcernProofs((current) => ({
                            ...current,
                            [question.id]: file,
                          }))
                        }
                      />
                    )}
                  </article>
                );
              })}
            </div>
          )}
          {active === 3 && (
            <div className={styles.scopeContent}>
              <header>
                <div>
                  <span>EMISSIONS ASSESSMENT</span>
                  <h2>Emissions, waste fate &amp; microplastics</h2>
                </div>
                <b className={styles.questionCount}>5 questions</b>
              </header>
              {emissionQuestions.map((question) => {
                const answer = emissionAnswers[question.id] || "";
                const guidance = question.guidance[answer];
                const detailLabel = question.detailLabels[answer];
                return (
                  <article className={styles.questionCard} key={question.id}>
                    <div className={styles.questionHeading}>
                      <span>{question.id}</span>
                      <div className={styles.questionCopy}>
                        <div className={styles.questionMeta}>
                          <b>
                            {question.id === 5 ? "Monitoring" : "Mandatory"}
                          </b>
                          <span>EU market</span>
                        </div>
                        <h3>{question.text}</h3>
                      </div>
                      <div className={styles.timeline}>
                        <CalendarDays size={17} aria-hidden="true" />
                        <span>
                          <small>
                            {question.id === 5 ? "TIMING" : "MANDATORY FROM"}
                          </small>
                          <b>
                            {question.id === 5
                              ? "No direct company deadline"
                              : "12 Aug 2026"}
                          </b>
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
                          setEmissionAnswers((current) => ({
                            ...current,
                            [question.id]: value,
                          }));
                          setEmissionDetails((current) => ({
                            ...current,
                            [question.id]: "",
                          }));
                          setEmissionProofs((current) => ({
                            ...current,
                            [question.id]: undefined,
                          }));
                          if (question.id === 5) setMonitoringDate("");
                        }}
                      >
                        <option value="" disabled>
                          Select an answer
                        </option>
                        {standardConcernOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    {answer && (
                      <EvidenceProof
                        key={`${question.id}-${answer}`}
                        questionId={question.id}
                        file={emissionProofs[question.id]}
                        onChange={(file) =>
                          setEmissionProofs((current) => ({
                            ...current,
                            [question.id]: file,
                          }))
                        }
                      />
                    )}
                    {guidance && (
                      <p className={styles.guidance} role="note">
                        <b>Action required:</b> {guidance}
                      </p>
                    )}
                    {question.id === 3 && (
                      <p className={styles.specificationNotice} role="note">
                        Do not invent an Art. 5 numerical threshold where none
                        is specified.
                      </p>
                    )}
                    {detailLabel && (
                      <label className={styles.descriptionField}>
                        {detailLabel} <span aria-hidden="true">*</span>
                        <textarea
                          required
                          rows={4}
                          value={emissionDetails[question.id] || ""}
                          onChange={(event) =>
                            setEmissionDetails((current) => ({
                              ...current,
                              [question.id]: event.target.value,
                            }))
                          }
                        />
                      </label>
                    )}
                    {question.id === 5 && answer === "No" && (
                      <label className={styles.descriptionField}>
                        Monitoring date <span aria-hidden="true">*</span>
                        <input
                          type="date"
                          required
                          value={monitoringDate}
                          onChange={(event) =>
                            setMonitoringDate(event.target.value)
                          }
                        />
                      </label>
                    )}
                  </article>
                );
              })}
            </div>
          )}
          {active === 4 && (
            <div className={styles.scopeContent}>
              <header>
                <div>
                  <span>CIRCULARITY ASSESSMENT</span>
                  <h2>Reuse &amp; recycling interaction</h2>
                </div>
                <b className={styles.questionCount}>4 mandatory questions</b>
              </header>
              {reuseRecyclingQuestions.map((question) => {
                const answer = reuseAnswers[question.id] || "";
                const requiresEvidence =
                  question.evidenceAnswers.includes(answer);
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
                          setReuseAnswers((current) => ({
                            ...current,
                            [question.id]: value,
                          }));
                          if (!question.evidenceAnswers.includes(value))
                            setReuseProofs((current) => ({
                              ...current,
                              [question.id]: undefined,
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
                    {requiresEvidence && (
                      <EvidenceProof
                        key={`${question.id}-${answer}`}
                        questionId={question.id}
                        file={reuseProofs[question.id]}
                        onChange={(file) =>
                          setReuseProofs((current) => ({
                            ...current,
                            [question.id]: file,
                          }))
                        }
                      />
                    )}
                  </article>
                );
              })}
            </div>
          )}
          <div hidden={active !== 5}>
            <HeavyMetalsAssessment onAnswered={setHeavyAnsweredCount} />
          </div>
          {active === 6 && (
            <div className={styles.scopeContent}>
              <header>
                <div>
                  <span>FOOD-CONTACT ASSESSMENT</span>
                  <h2>Food-contact gate</h2>
                </div>
                <b className={styles.questionCount}>3 mandatory questions</b>
              </header>
              {foodContactQuestions.map((question) => {
                const answer = foodContactAnswers[question.id] || "";
                const requiresEvidence =
                  question.evidenceAnswers.includes(answer);
                const guidance = question.guidance?.[answer];
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
                          <em>Food-contact PFAS rule, where applicable</em>
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
                          setFoodContactAnswers((current) => ({
                            ...current,
                            [question.id]: value,
                          }));
                          if (!question.evidenceAnswers.includes(value))
                            setFoodContactProofs((current) => ({
                              ...current,
                              [question.id]: undefined,
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
                    {guidance && (
                      <p className={styles.guidance} role="note">
                        <b>Action required:</b> {guidance}
                      </p>
                    )}
                    {requiresEvidence && (
                      <EvidenceProof
                        key={`${question.id}-${answer}`}
                        questionId={question.id}
                        file={foodContactProofs[question.id]}
                        onChange={(file) =>
                          setFoodContactProofs((current) => ({
                            ...current,
                            [question.id]: file,
                          }))
                        }
                      />
                    )}
                  </article>
                );
              })}
            </div>
          )}
          {active === 7 && (
            <div className={styles.scopeContent}>
              <header>
                <div>
                  <span>ARTICLE 5(5) ASSESSMENT</span>
                  <h2>PFAS detailed assessment</h2>
                </div>
                <b className={styles.questionCount}>12 questions</b>
              </header>
              {pfasQuestions.map((question, index) => {
                const number = index + 1;
                const answer = pfasAnswers[number] || "";
                const guidance = question.guidance[answer];
                const fail =
                  (answer === "Yes" && [3, 5, 7].includes(number)) ||
                  (number === 12 && answer === "No");
                return (
                  <article className={styles.questionCard} key={number}>
                    <div className={styles.questionHeading}>
                      <span>{number}</span>
                      <div className={styles.questionCopy}>
                        <div className={styles.questionMeta}>
                          <b>Article 5(5)</b>
                          <span>EU market</span>
                        </div>
                        <h3>{question.text}</h3>
                      </div>
                      <div className={styles.timeline}>
                        <CalendarDays size={17} aria-hidden="true" />
                        <span>
                          <small>MANDATORY FROM</small>
                          <b>12 Aug 2026</b>
                          {[8, 9].includes(number) && (
                            <em>
                              Fluorine proof required upon request if total
                              fluorine &gt;50 mg/kg
                            </em>
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
                          setPfasAnswers((current) => ({
                            ...current,
                            [number]: value,
                          }));
                          setPfasDetails((current) => ({
                            ...current,
                            [number]: "",
                          }));
                          setPfasProofs((current) => ({
                            ...current,
                            [number]: undefined,
                          }));
                        }}
                      >
                        <option value="" disabled>
                          Select an answer
                        </option>
                        {standardConcernOptions.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    {answer && (
                      <EvidenceProof
                        key={`${number}-${answer}`}
                        questionId={number}
                        file={pfasProofs[number]}
                        onChange={(file) =>
                          setPfasProofs((current) => ({
                            ...current,
                            [number]: file,
                          }))
                        }
                      />
                    )}
                    {guidance && (
                      <p
                        className={`${styles.guidance} ${fail ? styles.error : ""}`}
                        role={fail ? "alert" : "note"}
                      >
                        {number === 12 && pfasConflict && answer === "Yes"
                          ? "Review required: the selected PFAS PASS conclusion conflicts with a threshold-failure answer in question 3, 5 or 7."
                          : guidance}
                      </p>
                    )}
                    {answer && (
                      <label className={styles.descriptionField}>
                        {answer === "N/A"
                          ? "Not-applicable justification"
                          : number === 1 && answer === "Yes"
                            ? "Screening method and scope"
                            : number === 8 && answer === "No"
                              ? "Total fluorine assessment basis"
                              : number === 10 && answer === "Yes"
                                ? "PFAS function and quantified concentration"
                                : number === 12 && answer === "No"
                                  ? "Corrective action and assessment basis"
                                  : "Assessment details / supporting basis"}{" "}
                        <span aria-hidden="true">*</span>
                        <textarea
                          required
                          rows={3}
                          value={pfasDetails[number] || ""}
                          onChange={(event) =>
                            setPfasDetails((current) => ({
                              ...current,
                              [number]: event.target.value,
                            }))
                          }
                        />
                      </label>
                    )}
                  </article>
                );
              })}
              <footer className={styles.sectionFooter}>
                <span>
                  <ShieldCheck size={16} aria-hidden="true" /> Review all
                  thresholds, fluorine proof and supporting evidence before
                  recording the final conclusion.
                </span>
                <button type="button" onClick={() => choose(6)}>
                  <ArrowLeft size={17} /> Food-contact gate
                </button>
              </footer>
            </div>
          )}
          {active < 7 && (
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
