"use client";
import { persistAssessmentFile } from "@/lib/upload-media-client";
import { mediaAccept } from "@/lib/media-types";

import { useState } from "react";
import {
  CalendarDays,
  Calculator,
  FileText,
  UploadCloud,
  X,
} from "lucide-react";
import { calculateHeavyMetals } from "@/lib/heavy-metal-calculator";
import styles from "./article-5-assessment.module.css";
import metalStyles from "./heavy-metals-assessment.module.css";

const options = ["Yes", "No", "Unknown", "N/A"];
const calculatorOptions = [
  "Use calculator below",
  "Individual value not reported",
  "Not applicable — justify",
];
const questions = [
  "Has the presence of lead (Pb), cadmium (Cd), mercury (Hg) and hexavalent chromium [Cr(VI)] been assessed?",
  "Is the evidence traceable to the exact material grade, formulation, component and relevant production source?",
  "Is the result reported on a concentration basis that can be assessed against the 100 mg/kg threshold?",
  "Are the analytical method, sample preparation and reporting basis technically suitable for the material tested?",
  "If individual-analyte results are available, what is the validated lead (Pb) concentration for the selected sample basis?",
  "If individual-analyte results are available, what is the validated cadmium (Cd) concentration for the selected sample basis?",
  "If individual-analyte results are available, what is the validated mercury (Hg) concentration for the selected sample basis?",
  "If individual-analyte results are available, what is the validated hexavalent chromium [Cr(VI)] concentration for the selected sample basis?",
  "What is the validated combined concentration of Pb + Cd + Hg + Cr(VI) for the defined test specimen/sample basis?",
  "Does the validated combined concentration exceed 100 mg/kg?",
  "Has a currently effective delegated act changed the Article 5(4) threshold or created a qualifying derogation that actually applies to this packaging?",
];
const calculatorGuidance = [
  "Enter the value in the Heavy-Metal Calculator below. If the laboratory provides only a validated combined total, select that input method and document why separate Pb data are unavailable.",
  "Enter the value in the Heavy-Metal Calculator below. If using a validated combined total, document the basis in the calculator panel.",
  "Enter the value in the Heavy-Metal Calculator below. If using a validated combined total, document the basis in the calculator panel.",
  "Enter the value in the Heavy-Metal Calculator below. Do not substitute total chromium for Cr(VI) without a scientifically and legally valid basis.",
  "Use the Heavy-Metal Calculator below. Choose either the four-analyte input method or a combined total explicitly reported by the laboratory.",
];
function guidanceFor(number: number, answer: string) {
  if (!answer) return "";
  if (number >= 5 && number <= 9) return calculatorGuidance[number - 5];
  if (number === 10)
    return "PASS when the sum is ≤100 mg/kg. FAIL only when it is >100 mg/kg. Equality to 100 mg/kg does not exceed the limit. The calculator below supplies the numerical gate.";
  const branches: Record<number, Record<string, string>> = {
    1: {
      Yes: "Record results.",
      No: "Obtain evidence before closing Art. 5(4).",
      Unknown: "Obtain evidence before closing Art. 5(4).",
    },
    2: { Yes: "Continue.", No: "Obtain traceable evidence." },
    3: {
      Yes: "Continue.",
      No: "Obtain suitable units/basis or validated conversion.",
    },
    4: {
      Yes: "Accept for technical review.",
      No: "Obtain method details or suitable test.",
      Unknown: "Obtain method details or suitable test.",
    },
    11: {
      Yes: "Record the exact act, effective date, scope and all conditions; legal review required.",
      No: "Apply the current 100 mg/kg limit.",
      Unknown: "Pending legal review.",
    },
  };
  return branches[number]?.[answer] || "";
}

export default function HeavyMetalsAssessment({
  onAnswered,
}: {
  onAnswered: (count: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [details, setDetails] = useState<Record<number, string>>({});
  const [proofs, setProofs] = useState<Record<number, File | undefined>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [method, setMethod] = useState("four");
  const [values, setValues] = useState(["", "", "", ""]);
  const [combined, setCombined] = useState("");
  const [basis, setBasis] = useState("");
  const [totalBasis, setTotalBasis] = useState("");
  const [act, setAct] = useState({
    name: "",
    date: "",
    scope: "",
    conditions: "",
  });
  const result = calculateHeavyMetals(method === "four" ? values : [combined]);
  const mismatch =
    result &&
    ["Yes", "No"].includes(answers[10]) &&
    (answers[10] === "Yes") !== result.exceeds;
  return (
    <div className={styles.scopeContent}>
      <header>
        <div>
          <span>ARTICLE 5(4) ASSESSMENT</span>
          <h2>Heavy metals</h2>
        </div>
        <b className={styles.questionCount}>11 questions</b>
      </header>
      {questions.map((text, index) => {
        const number = index + 1;
        const answer = answers[number] || "";
        const guidance = guidanceFor(number, answer);
        const needsJustification =
          answer === "Not applicable — justify" ||
          answer === "Individual value not reported" ||
          answer === "N/A";
        return (
          <article className={styles.questionCard} key={number}>
            <div className={styles.questionHeading}>
              <span>{number}</span>
              <div className={styles.questionCopy}>
                <div className={styles.questionMeta}>
                  <b>{number === 11 ? "Legal review" : "Article 5(4)"}</b>
                  <span>EU market</span>
                </div>
                <h3>{text}</h3>
              </div>
              <div className={`${styles.timeline} ${metalStyles.timeline}`}>
                <CalendarDays size={17} aria-hidden="true" />
                <span>
                  <small>
                    {number === 11 ? "TIMING" : "PPWR APPLIES FROM"}
                  </small>
                  <b>
                    {number === 11
                      ? "Future delegated act — no application date fixed yet"
                      : "12 Aug 2026"}
                  </b>
                  {number !== 11 && (
                    <em>
                      Already regulated under previous EU packaging law; PPWR
                      applies from 12 Aug 2026
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
                  const next = { ...answers, [number]: event.target.value };
                  setAnswers(next);
                  onAnswered(Object.values(next).filter(Boolean).length);
                  setDetails((current) => ({ ...current, [number]: "" }));
                  setProofs((current) => ({ ...current, [number]: undefined }));
                  setErrors((current) => ({ ...current, [number]: "" }));
                  if (number === 11)
                    setAct({ name: "", date: "", scope: "", conditions: "" });
                }}
              >
                <option value="" disabled>
                  Select an answer
                </option>
                {(number >= 5 && number <= 9 ? calculatorOptions : options).map(
                  (option) => (
                    <option key={option}>{option}</option>
                  ),
                )}
              </select>
            </label>
            {answer && (
              <div className={styles.evidenceSection}>
                <h4>
                  Supporting evidence <span>Required</span>
                </h4>
                <p>
                  Attach the relevant laboratory report, specification or legal
                  evidence.
                </p>
                {proofs[number] ? (
                  <div className={styles.evidenceFile}>
                    <FileText size={21} />
                    <span>
                      <b>{proofs[number]?.name}</b>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove heavy metal proof ${number}`}
                      onClick={() =>
                        setProofs((current) => ({
                          ...current,
                          [number]: undefined,
                        }))
                      }
                    >
                      <X size={17} />
                    </button>
                  </div>
                ) : (
                  <label className={styles.evidenceUpload}>
                    <UploadCloud size={25} />
                    <span>
                      <b>Upload evidence document</b>
                      <small>
                        PDF, DOC, DOCX, XLS, XLSX, PNG or JPG · Max 10 MB
                      </small>
                    </span>
                    <input
                      type="file"
                      required
                      aria-label={`Heavy metal proof ${number}`}
                      accept={mediaAccept}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) {
                          setErrors((current) => ({
                            ...current,
                            [number]: "Choose a document up to 10 MB.",
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
                        setProofs((current) => ({
                          ...current,
                          [number]: file,
                        }));
                        setErrors((current) => ({ ...current, [number]: "" }));
                      }}
                    />
                  </label>
                )}
                {errors[number] && (
                  <p className={styles.error} role="alert">
                    {errors[number]}
                  </p>
                )}
              </div>
            )}
            {guidance && (
              <p className={styles.guidance} role="note">
                {guidance}
                {number >= 5 && number <= 10 && (
                  <>
                    {" "}
                    <a href="#heavy-metal-calculator">Open calculator ↓</a>
                  </>
                )}
              </p>
            )}
            {(needsJustification || (number === 1 && answer === "Yes")) && (
              <label className={styles.descriptionField}>
                {number === 1 && answer === "Yes"
                  ? "Assessment results"
                  : "Justification / reporting basis"}{" "}
                <span>*</span>
                <textarea
                  required
                  rows={3}
                  value={details[number] || ""}
                  onChange={(event) =>
                    setDetails((current) => ({
                      ...current,
                      [number]: event.target.value,
                    }))
                  }
                />
              </label>
            )}
            {number === 10 && mismatch && (
              <p className={styles.guidance} role="alert">
                Your answer differs from the calculator result. Review the
                answer and validated laboratory data.
              </p>
            )}
            {number === 11 && answer === "Yes" && (
              <div className={metalStyles.legalFields}>
                {(
                  [
                    ["name", "Exact delegated act"],
                    ["date", "Effective date"],
                    ["scope", "Applicable scope"],
                    ["conditions", "All qualifying conditions"],
                  ] as const
                ).map(([key, label]) => (
                  <label className={styles.descriptionField} key={key}>
                    {label} <span>*</span>
                    <input
                      required
                      type={key === "date" ? "date" : "text"}
                      value={act[key]}
                      onChange={(event) =>
                        setAct((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
                <p className={styles.guidance}>
                  Legal review required. The calculator retains the 100 mg/kg
                  baseline and does not automatically apply a derogation.
                </p>
              </div>
            )}
          </article>
        );
      })}
      <section
        id="heavy-metal-calculator"
        className={metalStyles.calculator}
        aria-labelledby="heavy-calculator-heading"
      >
        <header>
          <Calculator size={25} aria-hidden="true" />
          <div>
            <span>NUMERICAL GATE · ARTICLE 5(4)</span>
            <h2 id="heavy-calculator-heading">Heavy-Metal Calculator</h2>
          </div>
        </header>
        <p>
          Use validated concentrations in mg/kg for the same defined specimen.
          Do not treat unreported values as zero.
        </p>
        <label className={styles.descriptionField}>
          Test specimen / sample basis <span>*</span>
          <input
            required
            value={basis}
            onChange={(event) => setBasis(event.target.value)}
            placeholder="Material grade, formulation, component and production source"
          />
        </label>
        <label className={styles.answerField}>
          Input method
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value)}
          >
            <option value="four">Four-analyte input method</option>
            <option value="combined">
              Validated combined total reported by laboratory
            </option>
          </select>
        </label>
        {method === "four" ? (
          <div className={metalStyles.inputs}>
            {[
              "Lead (Pb)",
              "Cadmium (Cd)",
              "Mercury (Hg)",
              "Hexavalent chromium [Cr(VI)]",
            ].map((label, index) => (
              <label className={styles.descriptionField} key={label}>
                {label} · mg/kg
                <input
                  inputMode="decimal"
                  required
                  value={values[index]}
                  onChange={(event) =>
                    setValues((current) =>
                      current.map((value, i) =>
                        i === index ? event.target.value : value,
                      ),
                    )
                  }
                  placeholder="Enter validated value"
                />
              </label>
            ))}
          </div>
        ) : (
          <>
            <label className={styles.descriptionField}>
              Combined Pb + Cd + Hg + Cr(VI) · mg/kg
              <input
                inputMode="decimal"
                required
                value={combined}
                onChange={(event) => setCombined(event.target.value)}
              />
            </label>
            <label className={styles.descriptionField}>
              Laboratory reporting basis / unavailable individual results{" "}
              <span>*</span>
              <textarea
                required
                rows={4}
                value={totalBasis}
                onChange={(event) => setTotalBasis(event.target.value)}
                placeholder="Cite the validated laboratory combined total and explain why separate Pb / Cd / Hg / Cr(VI) results are unavailable."
              />
            </label>
          </>
        )}
        <p className={styles.guidance}>
          Do not substitute total chromium for Cr(VI) without a scientifically
          and legally valid basis. Values must be non-negative mg/kg
          concentrations, with up to 12 decimal places.
        </p>
        <div
          className={metalStyles.result}
          role="status"
          data-status={!result ? "pending" : result.exceeds ? "fail" : "pass"}
        >
          <b>
            {!result
              ? "PENDING — enter all validated concentrations"
              : `${result.exceeds ? "FAIL" : "PASS"} · ${result.total} mg/kg`}
          </b>
          <span>
            Baseline: Pb + Cd + Hg + Cr(VI) ≤100 mg/kg. Exactly 100 mg/kg passes
            the numerical gate.
          </span>
        </div>
        {result &&
          (!basis.trim() || (method === "combined" && !totalBasis.trim())) && (
            <p className={styles.guidance}>
              Documentation incomplete: record the sample basis
              {method === "combined"
                ? " and laboratory reporting basis"
                : ""}{" "}
              before completing the review.
            </p>
          )}
        <p>
          Numerical gate only. Evidence suitability, sample traceability and any
          applicable delegated act still require review.
        </p>
      </section>
    </div>
  );
}
