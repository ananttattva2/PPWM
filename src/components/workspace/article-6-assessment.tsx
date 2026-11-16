"use client";

import { persistAssessmentFile } from "@/lib/upload-media-client";
import { mediaAccept } from "@/lib/media-types";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  Layers3,
  Recycle,
  UploadCloud,
  X,
} from "lucide-react";
import shell from "./article-5-assessment.module.css";
import styles from "./article-6-assessment.module.css";

const tabs = [
  "Category & component map",
  "Design for recycling (DfR)",
  "Collection, sorting & recycled-at-scale",
  "Component-level rules",
] as const;

type Article6Question = {
  id: number;
  text: string;
  options: readonly string[];
  optional?: boolean;
  mandatory?: { primary: string; secondary?: string };
  labels?: Partial<Record<string, string>>;
  guidance?: Partial<Record<string, string>>;
  evidence: string;
  source: string;
};

const sectionOneQuestions: readonly Article6Question[] = [
  {
    id: 1,
    text: "Could an integrated component become separated from other integrated components due to mechanical stress during transport or sorting?",
    options: ["Yes", "No", "Unknown"],
    labels: { Unknown: "Not available" },
    guidance: {
      Yes: "YES -> carry out a separate assessment for the components that can separate under those conditions.",
      No: "NO -> assess the integrated set as part of the packaging unit.",
      Unknown: "UNKNOWN -> test/technical evaluation.",
    },
    evidence:
      "Transport/sorting stress evidence; construction detail; compatibility analysis",
    source: "Packaging engineer / test lab",
  },
  {
    id: 2,
    text: "For each separate component, has a separate design-for-recycling / recycled-at-scale assessment record been opened?",
    options: ["Yes", "No", "Unknown"],
    labels: { Unknown: "Not available" },
    guidance: {
      Yes: "YES -> link it to the SKU.",
      No: "NO -> create a separate component assessment.",
    },
    evidence: "Component-level assessment record and evidence ID",
    source: "Compliance team / packaging engineer",
  },
  {
    id: 3,
    text: "Is every component compatible with established collection, sorting and recycling processes proven in an operational environment?",
    options: ["Yes", "No", "Unknown"],
    labels: { Unknown: "Not available" },
    guidance: {
      Yes: "YES -> record evidence.",
      No: "NO -> identify incompatibility and redesign/justify before compliance conclusion.",
      Unknown: "UNKNOWN -> recycler/process evidence needed.",
    },
    evidence:
      "Compatibility assessment; established-process evidence; recycler technical feedback",
    source: "Packaging engineer / recycler / technical assessor",
  },
  {
    id: 4,
    text: "Could any component hinder the recyclability of the packaging unit's main body?",
    options: ["Yes", "No", "Unknown"],
    labels: { Unknown: "Not available" },
    guidance: {
      Yes: "YES -> identify component and effect; revise design or obtain a lawful/evidence-based resolution.",
      No: "NO -> document basis.",
      Unknown: "UNKNOWN -> investigate.",
    },
    evidence:
      "Component interaction/compatibility assessment; design rationale",
    source: "Packaging engineer / recycler",
  },
];

const sectionTwoQuestions: readonly Article6Question[] = [
  {
    id: 1,
    text: "Have all packaging components been included in the DfR assessment (including labels, sleeves, closures, adhesives, inks, lacquers, barriers/coatings and additives where present)?",
    options: ["Yes", "No", "Unknown"],
    labels: { Unknown: "Not available" },
    evidence:
      "Component BOM; Annex II Table 4 parameter checklist; supplier data",
    source: "Packaging engineer / suppliers",
  },
  {
    id: 2,
    text: "Have substances of concern that negatively affect reuse/recycling been flagged to the Article 5 assessment and the DfR assessment?",
    options: ["Yes", "No", "Unknown"],
    labels: { Unknown: "Not available" },
    evidence:
      "Substances-of-concern screen; Article 5 result; supplier declarations",
    source: "Chemical compliance / packaging engineer",
  },
  {
    id: 3,
    text: "Have the following parameters been screened if present: additives; labels/sleeves; closures; adhesives; colours; material composition; barriers/coatings; inks/lacquers/printing/coding; product residues/ease of emptying; ease of dismantling?",
    options: ["Yes", "No", "Unknown"],
    labels: { Unknown: "Not available" },
    evidence:
      "Substances-of-concern screen; Annex II Table 4 checklist; BOM; supplier specs; emptying/dismantling evidence",
    source: "Packaging design team / component suppliers",
  },
];

const sectionThreeQuestions: readonly Article6Question[] = [
  {
    id: 1,
    text: "Can the packaging be collected separately through relevant collection systems when it becomes waste?",
    options: ["Yes", "No", "Not available"],
    evidence:
      "Effective implementing act; Annex II category mapping; methodology reference",
    source: "Compliance team / EU regulatory reviewer",
  },
  {
    id: 2,
    text: "Once the applicable Article 6(5) implementing act and application date are effective, can the packaging be shown to meet the prescribed recycled-at-scale methodology for the relevant category?",
    options: ["Yes", "No", "Not available"],
    evidence:
      "Recycled tonnage data; category/material data; territory and reporting period",
    source: "PRO / recycler / sorting operator / system operator",
  },
  {
    id: 3,
    text: "When the Article 6(5) methodology applies, can the required data on quantities effectively recycled in the Union as a whole and in each relevant Member State be obtained for this category?",
    options: ["Yes", "No", "Not available"],
    evidence:
      "Collected-waste-to-facility quantity records; transfer notes; downstream records",
    source: "Collector / PRO / sorting facility",
  },
  {
    id: 4,
    text: "When the Article 6(5) methodology applies, is technical documentation available for the quantity of collected packaging waste sent to sorting and recycling facilities?",
    options: ["Yes", "No", "Not available"],
    evidence:
      "Verification procedure; downstream confirmations; audit/assurance data",
    source: "Manufacturer / PRO / downstream operators",
  },
  {
    id: 5,
    text: "When the Article 6(5) methodology applies, is a verification process in place that allows the manufacturer to obtain the required data from downstream operators?",
    options: ["Yes", "No", "Not available"],
    evidence:
      "Public data source/link; publication record; methodology reference",
    source: "Responsible data holder / compliance team",
  },
];

const sectionFourQuestions: readonly Article6Question[] = [
  {
    id: 1,
    text: "Has the applicable recycled-at-scale start date been determined and has an evidence route been planned for the relevant packaging category?",
    options: ["Yes", "No", "Not available"],
    optional: true,
    mandatory: {
      primary:
        "Later of 1 Jan 2035 or 5 years after the Art. 6(5) implementing act enters into force",
    },
    evidence: "Integrated component BOM; package-level assessment mapping",
    source: "Packaging engineer / technical assessor",
  },
  {
    id: 2,
    text: "Have component-level findings been rolled up to confirm no component hinders recyclability of the main body?",
    options: ["Yes", "No", "Not available"],
    optional: true,
    evidence: "Component-to-main-body compatibility matrix; design review",
    source: "Packaging engineer / recycler",
  },
  {
    id: 3,
    text: "Have relevant components such as cap/closure, label/sleeve, adhesive, ink, coating, liner, seal and other attached parts each been identified and linked to their material data?",
    options: ["Yes", "No", "Not available"],
    optional: true,
    evidence: "BOM; material declarations; drawings; supplier specifications",
    source: "Exporter / suppliers",
  },
];

const article6Questionnaire: Partial<
  Record<
    number,
    {
      mandatory: { primary: string; secondary?: string };
      questions: readonly Article6Question[];
    }
  >
> = {
  0: {
    mandatory: {
      primary: "DfR: later of 1 Jan 2030 / 24 months after Art. 6(4) act",
      secondary:
        "Recycled-at-scale: later of 1 Jan 2035 / 5 years after Art. 6(5) act",
    },
    questions: sectionOneQuestions,
  },
  1: {
    mandatory: {
      primary:
        "DfR: later of 1 Jan 2030 / 24 months after the Art. 6(4) delegated act enters into force",
    },
    questions: sectionTwoQuestions,
  },
  2: {
    mandatory: {
      primary:
        "Later of 1 Jan 2035 or 5 years after the Art. 6(5) implementing act enters into force",
    },
    questions: sectionThreeQuestions,
  },
  3: {
    mandatory: {
      primary: "DfR: later of 1 Jan 2030 / 24 months after Art. 6(4) act",
      secondary:
        "Recycled-at-scale: later of 1 Jan 2035 / 5 years after Art. 6(5) act",
    },
    questions: sectionFourQuestions,
  },
};

const article6Sections: Record<
  (typeof tabs)[number],
  {
    intro: string;
    cards: Array<{
      id: number;
      title: string;
      badge: string;
      summary: string;
      timeline: string;
      timelineNote: string;
      items?: string[];
      outcome?: string;
    }>;
  }
> = {
  "Category & component map": {
    intro:
      "Map the component into the correct Article 6 recyclability pathway before moving into detailed design and collection checks.",
    cards: [
      {
        id: 1,
        title: "Assessment boundary",
        badge: "Mandatory",
        summary:
          "Confirm how this component sits within the SKU and packaging system being assessed.",
        timeline: "Current review",
        timelineNote:
          "Align the component with the SKU and packaging architecture",
        items: [
          "Match the component to the assessed SKU and packaging system.",
          "Confirm whether the component is primary, secondary or tertiary in the packaging set.",
          "Record the packaging function and relationship to connected parts.",
        ],
      },
      {
        id: 2,
        title: "Category mapping",
        badge: "EU market",
        summary:
          "Place the component into the correct material family and packaging category for Article 6 review.",
        timeline: "Classification",
        timelineNote: "Use the saved material and packaging category logic",
        items: [
          "Confirm principal material family and current packaging category.",
          "Check whether the format needs any special treatment in the recyclability route.",
          "Capture the assumptions used for the selected category.",
        ],
      },
      {
        id: 3,
        title: "Expected outcome",
        badge: "Result",
        summary:
          "This section should leave the component clearly mapped to the right Article 6 decision path.",
        timeline: "Ready for DfR",
        timelineNote: "Move forward only when the category mapping is stable",
        outcome:
          "A clear component-to-category mapping that supports the later recyclability review.",
      },
    ],
  },
  "Design for recycling (DfR)": {
    intro:
      "Review the component design against the recyclability expectations that apply to its material stream and attached features.",
    cards: [
      {
        id: 1,
        title: "Design checks",
        badge: "Mandatory",
        summary:
          "Look at the features that can improve or reduce recyclability performance.",
        timeline: "Design review",
        timelineNote: "Capture restrictions early in the assessment",
        items: [
          "Review labels, closures, sleeves, coatings, adhesives and barrier layers.",
          "Check whether inks, additives or attached parts interfere with recycling.",
          "Record design features that support or reduce recyclability performance.",
        ],
      },
      {
        id: 2,
        title: "Evidence to retain",
        badge: "Records",
        summary:
          "Keep the technical details needed to support the DfR conclusion for this component.",
        timeline: "Evidence pack",
        timelineNote: "Save supplier and converter inputs with the assessment",
        items: [
          "DfR checklist or converter guidance.",
          "Component drawing, layer structure or assembly view.",
          "Supplier declarations covering inks, adhesives, coatings or attachments.",
        ],
      },
      {
        id: 3,
        title: "Expected outcome",
        badge: "Result",
        summary:
          "The design review should explain whether the component aligns with the recyclability expectations for its stream.",
        timeline: "DfR result",
        timelineNote:
          "Use this to support the next collection and sorting checks",
        outcome:
          "A documented DfR position for the component, including any design risk that needs remediation.",
      },
    ],
  },
  "Collection, sorting & recycled-at-scale": {
    intro:
      "Check the real-world pathway for the component after use, including whether it is collected, sorted and recycled at scale.",
    cards: [
      {
        id: 1,
        title: "Collection and sorting pathway",
        badge: "Operational",
        summary:
          "Understand whether the component can enter and move through a realistic recycling stream.",
        timeline: "Waste stream review",
        timelineNote: "Base the conclusion on the applicable market pathway",
        items: [
          "Identify the likely collection stream after use.",
          "Check whether the format is sortable in existing sorting infrastructure.",
          "Confirm whether the packaging type is recycled at scale.",
        ],
      },
      {
        id: 2,
        title: "Supporting evidence",
        badge: "Records",
        summary:
          "Retain the evidence that supports the collection and recycled-at-scale conclusion.",
        timeline: "Evidence pack",
        timelineNote: "Use market or operator evidence where available",
        items: [
          "Market recyclability guidance or compatibility studies.",
          "Scheme or operator statements.",
          "Internal or external recycled-at-scale evidence.",
        ],
      },
      {
        id: 3,
        title: "Expected outcome",
        badge: "Result",
        summary:
          "This section should show whether the component has a credible practical recycling route.",
        timeline: "Pathway result",
        timelineNote:
          "Carry this conclusion into component rule and grade review",
        outcome:
          "A traceable conclusion on whether the component can be collected, sorted and recycled at scale.",
      },
    ],
  },
  "Component-level rules": {
    intro:
      "Capture the rules that apply specifically to this component format before deciding the recyclability grade.",
    cards: [
      {
        id: 1,
        title: "Rule checks",
        badge: "Mandatory",
        summary:
          "Review the component-specific restrictions and compatibility rules that apply.",
        timeline: "Rule review",
        timelineNote:
          "Focus on the component format and how it interacts with the main pack",
        items: [
          "Review material-specific conditions that apply to this component format.",
          "Check compatibility rules between the component and the main packaging body.",
          "Flag restricted combinations that can reduce recyclability classification.",
        ],
      },
      {
        id: 2,
        title: "Evidence to retain",
        badge: "Records",
        summary:
          "Capture the rule sources used to support the component-level decision.",
        timeline: "Evidence pack",
        timelineNote: "Make the rule references easy to audit later",
        items: [
          "Component compatibility guidance.",
          "Internal compliance rules or policy notes.",
          "Material stream decision matrix.",
        ],
      },
      {
        id: 3,
        title: "Expected outcome",
        badge: "Result",
        summary:
          "This section should produce a clear view of the component-specific rule position.",
        timeline: "Rule result",
        timelineNote: "Use this as a direct input into grading",
        outcome:
          "A rule-based component conclusion that supports the later recyclability grade.",
      },
    ],
  },
};

export default function Article6Assessment({
  componentName,
  productName,
  material,
  componentSeparation,
  article5Href,
  backHref,
}: {
  componentName: string;
  productName: string;
  material?: string | null;
  componentSeparation?: string | null;
  article5Href: string;
  backHref: string;
}) {
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evidence, setEvidence] = useState<Record<string, File>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const id = useId();
  const panel = useRef<HTMLElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    tabRefs.current[0]?.focus({ preventScroll: true });
  }, []);

  const currentTab = tabs[active];
  const current = article6Sections[currentTab];
  const questionnaire = article6Questionnaire[active];
  const answeredCount = (section: number) => {
    const group = article6Questionnaire[section];
    if (!group) return 0;
    return group.questions.filter((question) =>
      Boolean(answers[`${section}:${question.id}`]),
    ).length;
  };

  function choose(index: number) {
    setActive(index);
    tabRefs.current[index]?.focus({ preventScroll: true });
    window.requestAnimationFrame(() =>
      panel.current?.scrollIntoView({ block: "start" }),
    );
  }

  function clearEvidence(key: string) {
    setEvidence((current) => {
      const updated = { ...current };
      delete updated[key];
      return updated;
    });
    setErrors((current) => {
      const updated = { ...current };
      delete updated[key];
      return updated;
    });
  }

  return (
    <main className={shell.page}>
      <header className={shell.header}>
        <div className={shell.heroArt} aria-hidden="true">
          <span className={shell.heroOrb} />
          <span className={shell.heroLeaf} />
          <span className={shell.heroLeafSecond} />
          <img
            src="/images/materials/bottle-splash.webp"
            alt=""
            width={720}
            height={720}
          />
        </div>
        <div>
          <span className={shell.eyebrow}>
            <Recycle size={15} aria-hidden="true" /> ARTICLE 6 · RECYCLABLE
            PACKAGING
          </span>
          <h1>Article 6 assessment</h1>
          <p>
            Complete the recyclability review for{" "}
            <strong>{componentName}</strong> in {productName}.
          </p>
          <div className={shell.heroTags}>
            <span>
              <Layers3 size={13} aria-hidden="true" /> Component assessment
            </span>
            <span>
              <CalendarDays size={13} aria-hidden="true" /> Article 6 workflow
            </span>
          </div>
        </div>
        <Link href={backHref}>
          <ArrowLeft size={16} /> Back to Articles
        </Link>
      </header>

      <section
        className={`${shell.identity} ${styles.identityWithSeparation}`}
        aria-label="Assessment context"
      >
        <span>
          <Recycle size={20} />
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
        <div>
          <small>COMPONENT SEPARATION</small>
          <b>{componentSeparation || "Not provided"}</b>
        </div>
      </section>

      <div className={shell.workspace}>
        <aside className={shell.sidebar}>
          <div className={shell.navigationHeading}>
            <span>YOUR ASSESSMENT</span>
            <small>{tabs.length} sections</small>
          </div>
          <nav
            className={shell.tabs}
            role="tablist"
            aria-label="Article 6 assessment sections"
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
        </aside>

        <section
          ref={panel}
          className={shell.panel}
          role="tabpanel"
          id={`${id}-panel`}
          aria-labelledby={`${id}-tab-${active}`}
        >
          <div className={shell.sectionOverview}>
            <span>
              SECTION {String(active + 1).padStart(2, "0")}{" "}
              <i>/ {String(tabs.length).padStart(2, "0")}</i>
            </span>
            <span>
              <Check size={14} aria-hidden="true" />{" "}
              {questionnaire
                ? `${answeredCount(active)} of ${questionnaire.questions.length} answered`
                : "3 review blocks"}
            </span>
          </div>

          <div className={shell.scopeContent}>
            <header>
              <div>
                <span>ARTICLE 6 REVIEW</span>
                <h2>{currentTab}</h2>
              </div>
              <b className={shell.questionCount}>
                {questionnaire
                  ? `${questionnaire.questions.length} guided questions`
                  : "3 guided cards"}
              </b>
            </header>

            <p className={styles.sectionIntro}>{current.intro}</p>

            {questionnaire
              ? questionnaire.questions.map((question) => {
                  const key = `${active}:${question.id}`;
                  const answer = answers[key] || "";
                  const document = evidence[key];
                  const answerLabel = answer
                    ? question.labels?.[answer] || answer
                    : answer;
                  const guidance = answer
                    ? question.guidance?.[answer]
                    : undefined;
                  return (
                    <article className={shell.questionCard} key={question.id}>
                      <div className={shell.questionHeading}>
                        <span>{question.id}</span>
                        <div className={shell.questionCopy}>
                          <div className={shell.questionMeta}>
                            <span>EU market</span>
                            <span>Article 6</span>
                          </div>
                          <h3>{question.text}</h3>
                        </div>
                        <div className={shell.timeline}>
                          <CalendarDays size={17} aria-hidden="true" />
                          <span>
                            <small>MANDATORY FROM (EU MARKET)</small>
                            <b>
                              {
                                (question.mandatory || questionnaire.mandatory)
                                  .primary
                              }
                            </b>
                            {(question.mandatory || questionnaire.mandatory)
                              .secondary && (
                              <em>
                                {
                                  (
                                    question.mandatory ||
                                    questionnaire.mandatory
                                  ).secondary
                                }
                              </em>
                            )}
                          </span>
                        </div>
                      </div>

                      <label className={shell.answerField}>
                        Answer{" "}
                        {question.optional ? (
                          <small>(Optional)</small>
                        ) : (
                          <span aria-hidden="true">*</span>
                        )}
                        <select
                          value={answer}
                          onChange={(event) =>
                            setAnswers((currentAnswers) => ({
                              ...currentAnswers,
                              [key]: event.target.value,
                            }))
                          }
                        >
                          <option value="" disabled>
                            Select an answer
                          </option>
                          {question.options.map((option) => (
                            <option key={option} value={option}>
                              {question.labels?.[option] || option}
                            </option>
                          ))}
                        </select>
                      </label>

                      {guidance && (
                        <p
                          className={`${shell.questionNote} ${styles.guidance}`}
                        >
                          <b>{answerLabel}:</b> {guidance}
                        </p>
                      )}

                      {active === 1 &&
                        question.id === 2 &&
                        answer === "Yes" && (
                          <p className={shell.questionNote}>
                            Continue this finding in{" "}
                            <Link href={article5Href}>
                              Article 5, Section 5: Reuse & recycling
                              interaction
                            </Link>
                            .
                          </p>
                        )}

                      {answer && (
                        <div className={shell.evidenceSection}>
                          <div>
                            <h4>
                              Supporting evidence <span>Required</span>
                            </h4>
                            <p>
                              Upload a document that supports the selected
                              answer.
                            </p>
                          </div>
                          <div className={shell.evidenceCollectionDetails}>
                            <p>
                              <b>Evidence to Collect / Prepare:</b>{" "}
                              {question.evidence}
                            </p>
                            <p>
                              <b>From whom to collect:</b> {question.source}
                            </p>
                          </div>
                          {document ? (
                            <div className={shell.evidenceFile}>
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
                                onClick={() => clearEvidence(key)}
                              >
                                <X size={17} />
                              </button>
                            </div>
                          ) : (
                            <label className={shell.evidenceUpload}>
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
                                accept={mediaAccept}
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;
                                  if (file.size > 10 * 1024 * 1024) {
                                    setErrors((current) => ({
                                      ...current,
                                      [key]: "Choose a document up to 10 MB.",
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
                                        "article 6 evidence",
                                    );
                                  } catch {
                                    return;
                                  }
                                  setEvidence((current) => ({
                                    ...current,
                                    [key]: file,
                                  }));
                                  setErrors((current) => {
                                    const updated = { ...current };
                                    delete updated[key];
                                    return updated;
                                  });
                                }}
                              />
                            </label>
                          )}
                          {errors[key] && (
                            <p className={shell.error} role="alert">
                              {errors[key]}
                            </p>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })
              : current.cards.map((card) => (
                  <article
                    className={`${shell.questionCard} ${styles.summaryCard}`}
                    key={card.id}
                  >
                    <div className={shell.questionHeading}>
                      <span>{card.id}</span>
                      <div className={shell.questionCopy}>
                        <div className={shell.questionMeta}>
                          <b>{card.badge}</b>
                          <span>Article 6</span>
                        </div>
                        <h3>{card.title}</h3>
                        <p className={shell.questionNote}>{card.summary}</p>
                      </div>
                      <div className={shell.timeline}>
                        <CalendarDays size={17} aria-hidden="true" />
                        <span>
                          <small>REVIEW CHECKPOINT</small>
                          <b>{card.timeline}</b>
                          <em>{card.timelineNote}</em>
                        </span>
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      {card.items ? (
                        <ul className={styles.bulletList}>
                          {card.items.map((item) => (
                            <li key={item}>
                              <FileText size={14} aria-hidden="true" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className={styles.outcomeBox}>
                          <Recycle size={18} aria-hidden="true" />
                          <p>{card.outcome}</p>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
          </div>
        </section>
      </div>
    </main>
  );
}
