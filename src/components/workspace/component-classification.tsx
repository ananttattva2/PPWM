"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check, ChevronRight, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  materialFamilies,
  packagingCategories,
} from "@/lib/packaging-classification";
import type { Classification } from "@/lib/packaging-classification";

function MaterialArt({
  family,
  variant = "",
}: {
  family: string;
  variant?: string;
}) {
  const id = useId();
  const blue = family === "Plastic";
  const colour = blue
    ? "#248bc1"
    : family === "Metals"
      ? "#637e8e"
      : family === "Wood" || family === "Paper/cardboard"
        ? "#ac8046"
        : "#347b51";
  const flexible = variant.includes("flexible");
  return (
    <svg
      viewBox="0 0 180 130"
      aria-hidden="true"
      className="classification-art"
    >
      <defs>
        <linearGradient id={id}>
          <stop stopColor="white" stopOpacity=".85" />
          <stop offset=".5" stopColor={colour} stopOpacity=".2" />
          <stop offset="1" stopColor={colour} stopOpacity=".6" />
        </linearGradient>
      </defs>
      <ellipse cx="90" cy="67" rx="62" ry="56" fill={colour} opacity=".08" />
      <g
        stroke={colour}
        strokeWidth="2.8"
        strokeLinejoin="round"
        fill={`url(#${id})`}
      >
        {variant === "textile" ? (
          <>
            <path
              d="M43 45h82c28 0 28 65 0 65H43c-21 0-21-65 0-65Z"
              fill="#d9cbb1"
            />
            <ellipse cx="125" cy="78" rx="19" ry="32" />
            <ellipse cx="125" cy="78" rx="9" ry="18" />
            <path d="M40 56h70M40 69h66M40 83h66M40 97h70" />
          </>
        ) : variant === "ceramics" ? (
          <>
            <path
              d="M65 30h47l-10 23c8 13 26 25 21 45-6 22-63 22-69 0-5-20 13-32 21-45Z"
              fill="#d2a789"
            />
            <ellipse cx="89" cy="30" rx="24" ry="7" />
            <path d="M63 83c16 9 37 9 52 0" />
          </>
        ) : variant === "eps" ? (
          <>
            <path d="m30 60 36-19 39 17-36 20Z" fill="#f3f5f5" />
            <path d="M30 60v35l39 20V78m36-20v35l-36 22" />
            <path d="m85 40 33-18 33 17-33 18Z" fill="#fff" />
            <path d="M85 40v38l33 17V57m33-18v39l-33 17" />
          </>
        ) : ["pp-rigid", "pet-rigid", "ps-xps", "other-rigid"].includes(
            variant,
          ) ? (
          <>
            <rect x="31" y="44" width="117" height="62" rx="10" />
            <rect
              x="27"
              y="37"
              width="125"
              height="15"
              rx="5"
              fill={colour}
              opacity=".6"
            />
            <path d="M48 60v29M61 97h69M32 70h115" />
          </>
        ) : ["pe-rigid", "hdpe-pp"].includes(variant) ? (
          <>
            <path d="M67 32h43v17l20 19v40H48V68l19-19Z" />
            <rect x="67" y="24" width="43" height="11" rx="3" fill={colour} />
            <path d="M69 52v23h18V48Z" fill="white" />
            <path d="M59 86h59v15H59Z" fill="white" opacity=".7" />
          </>
        ) : family === "Paper/cardboard" ? (
          <>
            <path d="M45 54 90 35 139 54 90 76Z" fill="#d6b77b" />
            <path d="M45 54v46l45 19V76m49-22v46l-49 19" />
            <path
              d="m45 54-16 23 48 17 13-18 15 18 48-17-14-23"
              fill="#e7cf9e"
            />
            <path d="M106 18h39v39l-18 8-21-13z" fill="#fffdf2" />
            <path d="m114 28 23 4m-23 6 23 4" />
          </>
        ) : family === "Wood" ? (
          <>
            <path d="m30 65 62-29 58 24-62 30Z" fill="#e4bf81" />
            <path d="M30 65v28l58 27V90m62-30v29l-62 31" />
            <path d="m43 66 52-22m-38 28 53-22m-39 29 53-22M40 84l37 17m24-3 37-18" />
          </>
        ) : family === "Metals" ? (
          <>
            <path d="M48 34v71c0 16 70 16 70 0V34" />
            <ellipse cx="83" cy="34" rx="35" ry="11" />
            <path d="M48 57c0 14 70 14 70 0m-70 29c0 14 70 14 70 0M60 40v63" />
            <path d="M107 78v33c0 13 44 13 44 0V78" fill="#c6bd90" />
            <ellipse cx="129" cy="78" rx="22" ry="8" />
          </>
        ) : flexible ? (
          <>
            <path d="m49 25 19 5 17-5 20 5 20-5 12 82-22 7-18-5-19 6-25-8Z" />
            <path d="m61 40 15 24-13 24m47-45-18 30 22 21M54 103l69 1" />
          </>
        ) : (
          <>
            <path d="M74 24v17c0 9-18 18-18 33v35c0 12 61 12 61 0V74c0-15-19-24-19-33V24" />
            <rect x="72" y="17" width="28" height="13" rx="3" fill={colour} />
            <path d="M58 74h57M58 86h57M58 99h57M69 50c-5 6-6 12-6 20" />
            <path d="M65 75h44v25H65z" fill="white" opacity=".65" />
            {family === "Multi-material" && (
              <>
                <path d="m108 75 37 9v33l-37-8z" fill="#d4b17a" />
                <path d="m108 75 15-8 35 8-13 9" />
              </>
            )}
          </>
        )}
      </g>
    </svg>
  );
}

export default function ComponentClassification({
  importId,
  rowNumber,
  componentId,
  componentName,
  productName,
  polymer,
  initial,
  canEdit,
}: {
  importId: string;
  rowNumber: number;
  componentId: string;
  componentName: string;
  productName: string;
  polymer: string;
  initial?: Pick<Classification, "family" | "categoryId">;
  canEdit: boolean;
}) {
  const [family, setFamily] = useState<Classification["family"] | null>(
    initial?.family || null,
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId || "");
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reduce = useReducedMotion();
  const categories = packagingCategories.filter(
    (category) => family === "Multi-material" || category.family === family,
  );
  async function chooseCategory(id: string) {
    if (!canEdit || !family || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/packaging-imports/${importId}/classification`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rowNumber,
            componentId,
            family,
            categoryId: id,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Could not save your selection. Please try again.",
        );
      setCategoryId(id);
      toast.info("Supplier details coming soon.", {
        description: "Your material and packaging category have been saved.",
      });
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="composition-builder classification-workspace">
      <header className="classification-heading">
        <div>
          <span className="composition-eyebrow">COMPONENT ANALYSIS</span>
          <h1>{componentName}</h1>
          <p>
            {productName} <span>· Polymer: {polymer || "Not provided"}</span>
          </p>
        </div>
        <Link className="gallery-analyse-link" href="/dashboard/clients">
          <ArrowLeft size={16} /> Packaging workspace
        </Link>
      </header>
      <nav className="classification-progress" aria-label="Analysis progress">
        <button
          type="button"
          disabled={busy}
          onClick={() => setStep(1)}
          aria-current={step === 1 ? "step" : undefined}
        >
          <span>{step === 2 ? <Check size={16} /> : "1"}</span> Material
        </button>
        <ChevronRight size={16} />
        <button
          type="button"
          disabled={!family || busy}
          onClick={() => setStep(2)}
          aria-current={step === 2 ? "step" : undefined}
        >
          <span>2</span> Packaging category
        </button>
        <ChevronRight size={16} />
        <span className="classification-upcoming">
          3 · Supplier details <small>Coming soon</small>
        </span>
      </nav>
      {!canEdit && (
        <p role="status">You have view-only access to this component.</p>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={step}
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -8 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          <div className="classification-intro">
            <div>
              <h2>
                {step === 1
                  ? "What material is this component made from?"
                  : "Choose the packaging category"}
              </h2>
              <p>
                {step === 1
                  ? "Select one material to continue."
                  : `${family} · Select the category that best describes this component.`}
              </p>
            </div>
            {step === 2 && (
              <button
                className="text-button"
                disabled={busy}
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={15} /> Change material
              </button>
            )}
          </div>
          {step === 1 ? (
            <div className="material-choice-grid">
              {materialFamilies.map((material) => (
                <button
                  type="button"
                  key={material}
                  className={`material-choice ${family === material ? "selected" : ""}`}
                  aria-pressed={family === material}
                  disabled={busy}
                  onClick={() => {
                    if (material !== family) setCategoryId("");
                    setFamily(material);
                    setStep(2);
                    setError("");
                  }}
                >
                  <MaterialArt family={material} />
                  <strong>{material}</strong>
                  {family === material && (
                    <span className="choice-check">
                      <Check size={16} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="category-choice-grid">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  className={`material-choice category-choice ${categoryId === category.id ? "selected" : ""}`}
                  aria-label={category.title}
                  aria-pressed={categoryId === category.id}
                  disabled={busy || !canEdit}
                  onClick={() => void chooseCategory(category.id)}
                >
                  <MaterialArt family={category.family} variant={category.id} />
                  <strong>{category.title}</strong>
                  <small>{category.detail}</small>
                  {categoryId === category.id && (
                    <span className="choice-check">
                      <Check size={16} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {busy && (
            <p className="classification-saving" role="status">
              <LoaderCircle size={16} className="spin" /> Saving your selection…
            </p>
          )}
          {step === 2 && categoryId && (
            <div className="classification-saved" role="status">
              <Check size={18} /> Selection saved. Supplier details coming soon.
            </div>
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
