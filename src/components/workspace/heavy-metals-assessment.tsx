"use client";
import { persistAssessmentFile } from "@/lib/upload-media-client";
import { mediaAccept } from "@/lib/media-types";

import { useDraftState } from "@/lib/use-draft-state";
import { CalendarDays, FileText, UploadCloud, X } from "lucide-react";
import { useEffect } from "react";
import { calculateHeavyMetals } from "@/lib/heavy-metal-calculator";
import styles from "./article-5-assessment.module.css";
import metalStyles from "./heavy-metals-assessment.module.css";

const options = ["Yes", "No", "Unknown"];
const analyteOptions = ["Yes", "No"];
const legacyAvailableAnswers = ["Use calculator below"];
const legacyUnavailableAnswers = [
  "Individual value not reported",
  "Not applicable — justify",
];
const metalLabels = [
  "Lead (Pb)",
  "Cadmium (Cd)",
  "Mercury (Hg)",
  "Hexavalent chromium [Cr(VI)]",
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
];
function normalizeAnalyteAnswer(answer: string) {
  if (analyteOptions.includes(answer)) return answer;
  if (legacyAvailableAnswers.includes(answer)) return "Yes";
  if (legacyUnavailableAnswers.includes(answer)) return "No";
  return "";
}
function guidanceFor(number: number, answer: string) {
  if (number === 9)
    return "This value is calculated automatically from Questions 5–8 and cannot be edited.";
  if (number >= 5 && number <= 8) {
    if (answer === "Yes")
      return `Enter the validated ${metalLabels[number - 5]} concentration in mg/kg.`;
    if (answer === "No")
      return `Provide the validated ${metalLabels[number - 5]} concentration after laboratory testing.`;
    return "";
  }
  if (!answer) return "";
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
  };
  return branches[number]?.[answer] || "";
}

export default function HeavyMetalsAssessment({
  onAnswered,
}: {
  onAnswered: (count: number) => void;
}) {
  const [answers, setAnswers] = useDraftState<Record<number, string>>(
    "heavy-answers",
    {},
  );
  const [details, setDetails] = useDraftState<Record<number, string>>(
    "heavy-details",
    {},
  );
  const [proofs, setProofs] = useDraftState<Record<number, File | undefined>>(
    "heavy-proofs",
    {},
  );
  const [errors, setErrors] = useDraftState<Record<number, string>>(
    "heavy-errors",
    {},
  );
  const [values, setValues] = useDraftState("heavy-values", ["", "", "", ""]);
  const result = calculateHeavyMetals(values);
  useEffect(() => {
    const standardAnswers = [1, 2, 3, 4].filter((number) =>
      Boolean(answers[number]),
    ).length;
    const analyteAnswers = [5, 6, 7, 8].filter((number) =>
      Boolean(normalizeAnalyteAnswer(answers[number] || "")),
    ).length;
    onAnswered(standardAnswers + analyteAnswers + Number(Boolean(result)));
  }, [answers, values, result?.total]);
  return (
    <div className={styles.scopeContent}>
      <header>
        <div>
          <span>ARTICLE 5(4) ASSESSMENT</span>
          <h2>Heavy metals</h2>
        </div>
        <b className={styles.questionCount}>9 questions</b>
      </header>
      {questions.map((text, index) => {
        const number = index + 1;
        const storedAnswer =
          answers[number] === "N/A" ? "Unknown" : answers[number] || "";
        const answer =
          number >= 5 && number <= 8
            ? normalizeAnalyteAnswer(storedAnswer)
            : number === 9
              ? ""
              : storedAnswer;
        const guidance = guidanceFor(number, answer);
        const needsJustification = answer === "Unknown";
        return (
          <article
            className={styles.questionCard}
            data-question-number={number}
            key={number}
          >
            <div className={styles.questionHeading}>
              <span>{number}</span>
              <div className={styles.questionCopy}>
                <div className={styles.questionMeta}>
                  <b>Article 5(4)</b>
                  <span>EU market</span>
                </div>
                <h3>{text}</h3>
              </div>
              <div className={`${styles.timeline} ${metalStyles.timeline}`}>
                <CalendarDays size={17} aria-hidden="true" />
                <span>
                  <small>PPWR APPLIES FROM</small>
                  <b>12 Aug 2026</b>
                  <em>
                    Already regulated under previous EU packaging law; PPWR
                    applies from 12 Aug 2026
                  </em>
                </span>
              </div>
            </div>
            {number !== 9 && (
              <label className={styles.answerField}>
                {number >= 5 && number <= 8
                  ? "Is the validated concentration available?"
                  : "Answer"}{" "}
                <span aria-hidden="true">*</span>
                <select
                  required
                  value={answer}
                  onChange={(event) => {
                    const next = { ...answers, [number]: event.target.value };
                    setAnswers(next);
                    setDetails((current) => ({ ...current, [number]: "" }));
                    setProofs((current) => ({
                      ...current,
                      [number]: undefined,
                    }));
                    setErrors((current) => ({ ...current, [number]: "" }));
                    if (
                      number >= 5 &&
                      number <= 8 &&
                      event.target.value === "No"
                    )
                      setValues((current) =>
                        current.map((value, valueIndex) =>
                          valueIndex === number - 5 ? "" : value,
                        ),
                      );
                  }}
                >
                  <option value="" disabled>
                    Select an answer
                  </option>
                  {(number >= 5 && number <= 8 ? analyteOptions : options).map(
                    (option) => (
                      <option key={option} value={option}>
                        {option === "Unknown" ? "Not Available" : option}
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}
            {number >= 5 && number <= 8 && answer === "Yes" && (
              <label
                className={`${styles.descriptionField} ${metalStyles.inlineValue}`}
              >
                Validated {metalLabels[number - 5]} concentration <span>*</span>
                <input
                  required
                  inputMode="decimal"
                  pattern="\\d{1,18}(?:\\.\\d{1,12})?"
                  title="Enter a non-negative concentration with up to 12 decimal places."
                  value={values[number - 5]}
                  onChange={(event) =>
                    setValues((current) =>
                      current.map((value, valueIndex) =>
                        valueIndex === number - 5 ? event.target.value : value,
                      ),
                    )
                  }
                  placeholder="Enter validated value"
                />
                <small>mg/kg</small>
              </label>
            )}
            {number === 9 && (
              <div className={metalStyles.questionResult}>
                <div className={metalStyles.sourceValues}>
                  {metalLabels.map((label, valueIndex) => (
                    <span key={label}>
                      <small>{label}</small>
                      <b>
                        {values[valueIndex] || "Pending"}
                        {values[valueIndex] ? " mg/kg" : ""}
                      </b>
                    </span>
                  ))}
                </div>
                <label className={styles.descriptionField}>
                  Combined concentration
                  <input
                    readOnly
                    value={result?.total || ""}
                    placeholder="Awaiting Questions 5–8"
                  />
                  <small>mg/kg</small>
                </label>
                <div
                  className={metalStyles.result}
                  role="status"
                  data-status={
                    !result ? "pending" : result.exceeds ? "fail" : "pass"
                  }
                >
                  <b>
                    {!result
                      ? "PENDING — laboratory results required"
                      : result.exceeds
                        ? "NOT COMPLIANT"
                        : "COMPLIANT"}
                  </b>
                  <span>
                    {!result
                      ? "All four validated values are required."
                      : `${result.total} mg/kg ${result.exceeds ? "exceeds" : "does not exceed"} the 100 mg/kg limit.`}
                  </span>
                </div>
              </div>
            )}
            {answer && !(number >= 5 && number <= 8 && answer === "No") && (
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
          </article>
        );
      })}
    </div>
  );
}
