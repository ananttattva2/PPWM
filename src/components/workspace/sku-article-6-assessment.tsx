"use client";

import { mediaAccept } from "@/lib/media-types";
import { persistAssessmentFile } from "@/lib/upload-media-client";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  UploadCloud,
  X,
} from "lucide-react";
import styles from "./sku-level-assessment.module.css";

const sections = [
  "Scope & baseline",
  "Category & component map",
  "Design for recycling (DfR)",
  "Collection, sorting & recycled-at-scale",
  "Grades & market-placement dates",
  "Exemptions & innovative packaging",
  "EPR fee modulation & records",
] as const;

type ScopeQuestion = {
  id: number;
  text: string;
  evidence: string;
  source: string;
  mandatory: string | readonly string[];
};

const scopeQuestions: readonly ScopeQuestion[] = [
  {
    id: 1,
    text: "Is this item packaging within the meaning of Article 3(1)(1)?",
    evidence:
      "Packaging classification rationale; package/product description; design drawing",
    source: "Exporter / compliance reviewer",
    mandatory:
      "12 Aug 2026 (general recyclability requirement; interim framework)",
  },
  {
    id: 2,
    text: "For packaging placed on the EU market on or after 12 August 2026, has the current Article 6(1) recyclability requirement been assessed under the interim framework applicable before the Article 6(2)(a) DfR criteria start date?",
    evidence:
      "Current recyclability assessment; packaging specification/BOM; recyclability rationale; relevant technical evidence under Directive 94/62/EC / EN 13430:2004, where applicable",
    source:
      "Indian manufacturer/exporter + packaging engineer / technical assessor",
    mandatory:
      "12 Aug 2026 (general recyclability requirement; interim framework)",
  },
  {
    id: 3,
    text: "Could this packaging fall within one of the specific Article 6(11) categories excluded from Article 6?",
    evidence:
      "Product/sector description; packaging type; contact/use information; transport classification",
    source: "Exporter / regulatory reviewer",
    mandatory: "12 Aug 2026 (check whether the Article 6 exemption applies)",
  },
  {
    id: 4,
    text: "Is it immediate packaging as defined in Directive 2001/83/EC or Regulation (EU) 2019/6?",
    evidence:
      "Medicinal-product classification; packaging role; legal assessment",
    source: "Pharma regulatory team / EU customer",
    mandatory: "12 Aug 2026 (check whether the Article 6 exemption applies)",
  },
  {
    id: 5,
    text: "Is it contact-sensitive packaging of a medical device or an in-vitro diagnostic medical device covered by Regulations (EU) 2017/745 or 2017/746?",
    evidence:
      "Device classification; contact-sensitive packaging specification; regulatory declaration",
    source: "Medical-device regulatory team",
    mandatory: "12 Aug 2026 (check whether the Article 6 exemption applies)",
  },
  {
    id: 6,
    text: "Is it outer packaging for a medicinal product and necessary to comply with specific requirements to preserve the medicinal product's quality?",
    evidence:
      "Outer-packaging classification; quality-preservation justification",
    source: "Pharma regulatory team / product owner",
    mandatory: "12 Aug 2026 (check whether the Article 6 exemption applies)",
  },
  {
    id: 7,
    text: "Is it contact-sensitive packaging for infant/follow-on formula, specified baby foods, or food for special medical purposes under Regulation (EU) No 609/2013?",
    evidence:
      "Product classification; food category; contact-sensitive declaration",
    source: "Food regulatory team / customer",
    mandatory: "12 Aug 2026 (check whether the Article 6 exemption applies)",
  },
  {
    id: 8,
    text: "Is the packaging used to transport dangerous goods in accordance with Directive 2008/68/EC?",
    evidence:
      "Dangerous-goods classification; transport packaging specification",
    source: "Dangerous-goods compliance team / logistics provider",
    mandatory: "12 Aug 2026 (check whether the Article 6 exemption applies)",
  },
  {
    id: 9,
    text: "Is it sales packaging made from lightweight wood, cork, textile, rubber, ceramic, porcelain or wax?",
    evidence:
      "Material declaration; sales-packaging classification; weight/design data",
    source: "Supplier / exporter",
    mandatory: "12 Aug 2026 (check whether the Article 6 exemption applies)",
  },
  {
    id: 10,
    text: "Is an Article 6(11) exclusion fully substantiated for this packaging unit?",
    evidence: "Exemption decision record; evidence cross-references",
    source: "Compliance reviewer / EU regulatory adviser",
    mandatory: "12 Aug 2026 (check whether the Article 6 exemption applies)",
  },
];

const categoryQuestions: readonly ScopeQuestion[] = [
  {
    id: 1,
    text: "Has the packaging been assigned a predominant material and an Annex II Table 1 packaging category?",
    evidence:
      "Predominant-material declaration; packaging data sheet; category rationale",
    source: "Manufacturer / packaging engineer",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
  {
    id: 2,
    text: "Is the current Annex II category mapping consistent with the material/type format of this packaging?",
    evidence:
      "Category mapping record; Annex II reference; technical classification",
    source: "Compliance reviewer",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
  {
    id: 3,
    text: "Is a complete bill of materials available for the unit, listing every integrated and separate packaging component?",
    evidence:
      "BOM with component IDs, materials, weight, supplier and joining method",
    source: "Packaging designer / suppliers",
    mandatory: [
      "Design for recycling (DfR): Later of 1 Jan 2030 or 24 months after the Article 6(4) act",
      "Recycled at scale: Later of 1 Jan 2035 or five years after the Article 6(5) act",
    ],
  },
];

const designForRecyclingQuestions: readonly ScopeQuestion[] = [
  {
    id: 1,
    text: "When the Article 6(2)(a) design-for-recycling (DfR) requirements have become applicable for this packaging, does the packaging meet the effective DfR criteria rather than being only theoretically recyclable?",
    evidence:
      "DfR assessment under the effective delegated act; design/specification; component BOM; Annex II category and relevant parameters",
    source: "Manufacturer / packaging design team",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
  {
    id: 2,
    text: "Can the resulting secondary raw materials be of sufficient quality to substitute primary raw materials?",
    evidence:
      "Output-quality data; recycling process information; material performance evidence",
    source: "Recycler / materials specialist / packaging engineer",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
  {
    id: 3,
    text: "Can packaging waste be separated into different material streams for recycling where relevant?",
    evidence: "Separation assessment; design/dismantling evidence",
    source: "Packaging engineer / sorting operator",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
  {
    id: 4,
    text: "Can the packaging be sorted into the intended specific waste stream without affecting the recyclability of other streams?",
    evidence: "Sorting compatibility evidence; facility/process documentation",
    source: "Sorting operator / recycler / technical assessor",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
  {
    id: 5,
    text: "Has the assessment considered available recycling technologies and their economic and environmental performance?",
    evidence:
      "Technology review; recycling process evidence; economic/environmental evaluation",
    source: "Technical assessor / recycler",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
  {
    id: 6,
    text: "Does the assessment consider output quality, availability of waste, energy required and greenhouse-gas emissions where relevant?",
    evidence: "Recycling impact data; output-quality and process data",
    source: "Technical assessor / recycler",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
  {
    id: 7,
    text: "If the effective Article 6(4) delegated act has reached its application date, is the DfR assessment performed using the prescribed category methodology, criteria and weighting?",
    evidence:
      "Assessment methodology; scoring workbook; delegated-act version; parameter weights",
    source: "Manufacturer / qualified technical assessor",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
  {
    id: 8,
    text: "Once the relevant DfR criteria apply, have the category-specific criteria and conditions for the relevant recyclability grade been checked against the current effective act?",
    evidence: "Category-specific criteria; technical assessment report",
    source: "Technical assessor / compliance team",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
  {
    id: 9,
    text: "When DfR grading is legally applicable, is the score/grade calculated per packaging unit using the effective methodology, material-specific criteria, sorting efficiency and required weighting?",
    evidence: "Scoring calculations; test/assessment report",
    source: "Qualified technical assessor",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
  {
    id: 10,
    text: "Has the packaging grade been determined using the applicable official methodology and applicable market-placement date?",
    evidence: "Grade report; calculation; version of applicable criteria",
    source: "Manufacturer / technical assessor",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
];

const collectionAndSortingQuestions: readonly ScopeQuestion[] = [
  {
    id: 1,
    text: "When it becomes waste, can this packaging be separately collected through relevant collection systems?",
    evidence:
      "Collection-system evidence; local collection route; PRO/authority information",
    source: "EU importer / PRO / waste operator",
    mandatory:
      "Later of 1 Jan 2035 or five years after the Article 6(5) implementing act enters into force",
  },
  {
    id: 2,
    text: "Can the packaging be sorted into the intended specific waste stream?",
    evidence: "Sorting process evidence; facility acceptance/specification",
    source: "Sorting operator / recycler",
    mandatory:
      "Later of 1 Jan 2035 or five years after the Article 6(5) implementing act enters into force",
  },
  {
    id: 3,
    text: "Can it be sorted without affecting the recyclability of other waste streams?",
    evidence: "Sorting compatibility / contamination evidence",
    source: "Sorting operator / recycler",
    mandatory:
      "Later of 1 Jan 2035 or five years after the Article 6(5) implementing act enters into force",
  },
  {
    id: 4,
    text: "When required by the effective Article 6(5) implementing act, are the specified recycled-at-scale data available and easily accessible to the public?",
    evidence:
      "Recycling-at-scale evidence or action plan; supplier/customer data commitments",
    source: "Exporter / EU customer / PRO",
    mandatory:
      "Later of 1 Jan 2035 or five years after the Article 6(5) implementing act enters into force",
  },
];

const componentLevelQuestions: readonly ScopeQuestion[] = [
  {
    id: 1,
    text: "Has the applicable DfR score been checked against the Annex II Table 3 thresholds?",
    evidence: "Score report; applicable methodology/version",
    source: "Technical assessor",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
  {
    id: 2,
    text: "Has the DfR start date been established as the later of 1 January 2030 or 24 months after entry into force of the relevant Article 6(4) delegated act?",
    evidence:
      "Delegated-act effective date; timeline calculation; legal monitoring record",
    source: "Compliance / EU regulatory reviewer",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
  {
    id: 3,
    text: "From the applicable DfR start date, is the packaging grade A, B or C under the valid criteria?",
    evidence:
      "Grade result; effective criteria; exemption/derogation decision, if relevant",
    source: "Manufacturer / compliance reviewer",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
  {
    id: 4,
    text: "From the applicable DfR start date, is the packaging grade A, B or C under the effective methodology?",
    evidence: "Current grade report; applicable methodology/version",
    source: "Manufacturer / compliance reviewer",
    mandatory:
      "Later of 1 Jan 2030 or 24 months after the Article 6(4) delegated act enters into force",
  },
];

const gradesAndMarketPlacementQuestions: readonly ScopeQuestion[] = [
  {
    id: 1,
    text: "Has the relevant Article 6(5) implementing act been published, entered into force and reached its application date for this assessment?",
    evidence: "Exemption memo; product/category evidence",
    source: "Compliance / legal reviewer",
    mandatory:
      "Commission implementing-act deadline: 1 Jan 2030; operator recycled-at-scale criteria apply from the later of 1 Jan 2035 or five years after the Article 6(5) implementing act enters into force",
  },
  {
    id: 2,
    text: "Is the packaging claimed to be innovative packaging as defined in Article 3(1)(46), involving new materials, significant improvement in packaging functions and demonstrable overall environmental benefits?",
    evidence:
      "Innovation dossier; comparison with existing packaging; environmental-benefit evidence",
    source: "Manufacturer / R&D / environmental assessor",
    mandatory:
      "From 1 Jan 2030 (prior notification required before market placement)",
  },
  {
    id: 3,
    text: "If not compliant with Article 6(2), is the planned market placement on or after 1 January 2030 and within the permitted derogation period?",
    evidence: "First-market-placement date; annual timeline; derogation record",
    source: "Manufacturer / compliance team",
    mandatory:
      "From 1 Jan 2030 (prior notification required before market placement)",
  },
  {
    id: 4,
    text: "Before placement on the market, has the competent authority been notified of the innovative packaging?",
    evidence: "Prior notification; receipt/reference number",
    source: "Economic operator / competent authority",
    mandatory:
      "From 1 Jan 2030 (prior notification required before market placement)",
  },
  {
    id: 5,
    text: "Does the notification include all technical details demonstrating the packaging's innovative nature?",
    evidence:
      "Technical innovation dossier; new material/function description; environmental evidence",
    source: "Manufacturer / R&D team",
    mandatory:
      "From 1 Jan 2030 (prior notification required before market placement)",
  },
  {
    id: 6,
    text: "Does the notification include a timeline for reaching recycled-at-scale requirements in terms of collection and recycling?",
    evidence:
      "Collection/recycling roadmap; targets/milestones; responsible parties",
    source: "Manufacturer / PRO / EU customer",
    mandatory:
      "From 1 Jan 2030 (prior notification required before market placement)",
  },
  {
    id: 7,
    text: "Has the competent authority assessed whether the packaging is innovative and communicated its conclusion as required?",
    evidence: "Competent-authority correspondence; decision record",
    source: "Competent authority / economic operator",
    mandatory:
      "From 1 Jan 2030 (prior notification required before market placement)",
  },
  {
    id: 8,
    text: "Is the expiry of any Article 6(10) derogation tracked against the end of the placement calendar year plus the maximum permitted period?",
    evidence: "Derogation expiry tracker; placement records",
    source: "Compliance owner",
    mandatory:
      "From 1 Jan 2030 (prior notification required before market placement)",
  },
];

const exemptionsAndInnovationQuestions: readonly ScopeQuestion[] = [
  {
    id: 1,
    text: "If producer EPR contributions apply, is the packaging recyclability grade linked to the national EPR fee-modulation mechanism when the relevant acts apply?",
    evidence:
      "Grade evidence; EPR fee schedule; national PRO/authority documents",
    source: "Producer / PRO / EPR adviser",
    mandatory:
      "18 months after the relevant Article 6(4) delegated and Article 6(5) implementing acts enter into force",
  },
  {
    id: 2,
    text: "When the applicable Article 6(2) and (3) recyclability criteria are in force and applicable, is compliance demonstrated in the Annex VII technical documentation?",
    evidence:
      "Annex VII technical file; recyclability assessment; grade calculation; report index",
    source: "Manufacturer / compliance owner",
    mandatory: [
      "Design for recycling (DfR): Later of 1 Jan 2030 or 24 months after the Article 6(4) act",
      "Recycled at scale: Later of 1 Jan 2035 or five years after the Article 6(5) act",
    ],
  },
];

const article6Questions: Partial<Record<number, readonly ScopeQuestion[]>> = {
  0: scopeQuestions,
  1: categoryQuestions,
  2: designForRecyclingQuestions,
  3: collectionAndSortingQuestions,
  4: componentLevelQuestions,
  5: gradesAndMarketPlacementQuestions,
  6: exemptionsAndInnovationQuestions,
};

const answerOptions = ["Yes", "No", "Not available"] as const;

export default function SkuArticle6Assessment({
  productName,
  backHref,
}: {
  productName: string;
  backHref: string;
}) {
  const id = useId();
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const currentQuestions = article6Questions[active] || [];

  function choose(index: number) {
    setActive(index);
    tabRefs.current[index]?.focus();
  }

  function clearFile(questionKey: string) {
    setFiles((current) => ({ ...current, [questionKey]: undefined }));
    setErrors((current) => ({ ...current, [questionKey]: "" }));
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span>SKU ANALYSE · ARTICLE 6</span>
          <h1>Article 6 assessment</h1>
          <p>{productName}</p>
        </div>
        <Link href={backHref}>
          <ArrowLeft size={16} /> Back to Articles
        </Link>
      </header>

      <nav
        className={`${styles.tabs} ${styles.articleSixTabs}`}
        role="tablist"
        aria-label="Article 6 SKU assessment sections"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? sections.length - 1
                : event.key === "ArrowRight"
                  ? (active + 1) % sections.length
                  : (active - 1 + sections.length) % sections.length;
          choose(next);
        }}
      >
        {sections.map((section, index) => (
          <button
            key={section}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-selected={active === index}
            aria-controls={`${id}-panel`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => choose(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {section}
          </button>
        ))}
      </nav>

      <section
        className={`${styles.panel} ${styles.articleSixPanel}`}
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
      >
        <header>
          <div>
            <span>
              ARTICLE 6 · SECTION {String(active + 1).padStart(2, "0")}
            </span>
            <h2>{sections[active]}</h2>
          </div>
          <b>
            {currentQuestions.length
              ? `${currentQuestions.length} optional questions`
              : `${active + 1} of ${sections.length}`}
          </b>
        </header>

        {currentQuestions.length > 0 && (
          <div className={styles.articleSixQuestions}>
            {currentQuestions.map((question) => {
              const questionKey = `${active}:${question.id}`;
              const answer = answers[questionKey] || "";
              const file = files[questionKey];
              const mandatoryDates = Array.isArray(question.mandatory)
                ? question.mandatory
                : [question.mandatory];
              return (
                <article className={styles.question} key={question.id}>
                  <div className={styles.questionHeading}>
                    <span>{question.id}</span>
                    <div className={styles.copy}>
                      <div className={styles.badges}>
                        <b>Optional</b>
                        <em>EU market</em>
                      </div>
                      <h3>{question.text}</h3>
                    </div>
                    <div className={styles.timeline}>
                      <CalendarDays size={18} aria-hidden="true" />
                      <span>
                        <small>MANDATORY FROM (EU MARKET)</small>
                        {mandatoryDates.map((date) => (
                          <b key={date}>{date}</b>
                        ))}
                      </span>
                    </div>
                  </div>

                  <label className={styles.answer}>
                    Answer <small>(Optional)</small>
                    <select
                      value={answer}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [questionKey]: event.target.value,
                        }))
                      }
                    >
                      <option value="" disabled>
                        Select an answer
                      </option>
                      {answerOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  {answer && (
                    <div className={styles.evidence}>
                      <div>
                        <h4>
                          Supporting evidence <span>Required</span>
                        </h4>
                        <p>Upload a document supporting the selected answer.</p>
                      </div>
                      <div className={styles.articleSixEvidenceDetails}>
                        <p>
                          <b>Evidence to Collect / Prepare:</b>{" "}
                          {question.evidence}
                        </p>
                        <p>
                          <b>From whom to collect:</b> {question.source}
                        </p>
                      </div>
                      {file ? (
                        <div className={styles.file}>
                          <FileText size={22} aria-hidden="true" />
                          <span>
                            <b>{file.name}</b>
                            <small>{(file.size / 1024).toFixed(1)} KB</small>
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove evidence for question ${question.id}`}
                            onClick={() => clearFile(questionKey)}
                          >
                            <X size={17} />
                          </button>
                        </div>
                      ) : (
                        <label className={styles.upload}>
                          <UploadCloud size={26} aria-hidden="true" />
                          <span>
                            <b>Upload evidence document</b>
                            <small>
                              PDF, DOC, DOCX, XLS, XLSX, PNG or JPG · Max 10 MB
                            </small>
                          </span>
                          <input
                            type="file"
                            accept={mediaAccept}
                            onChange={async (event) => {
                              const selected = event.target.files?.[0];
                              if (!selected) return;
                              if (selected.size > 10 * 1024 * 1024) {
                                setErrors((current) => ({
                                  ...current,
                                  [questionKey]:
                                    "Choose a document up to 10 MB.",
                                }));
                                event.target.value = "";
                                return;
                              }
                              try {
                                await persistAssessmentFile(
                                  selected,
                                  question.text,
                                );
                              } catch {
                                return;
                              }
                              setFiles((current) => ({
                                ...current,
                                [questionKey]: selected,
                              }));
                              setErrors((current) => ({
                                ...current,
                                [questionKey]: "",
                              }));
                            }}
                          />
                        </label>
                      )}
                      {errors[questionKey] && (
                        <p className={styles.error} role="alert">
                          {errors[questionKey]}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
