"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  ChevronRight,
  LoaderCircle,
  Boxes,
  Search,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
  Package,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import type { CompositionComponent } from "@/lib/packaging-composition";
import SustainabilityChecklist from "./sustainability-checklist";
import PackagingBackLink from "./packaging-back-link";
import {
  materialFamilies,
  packagingCategories,
} from "@/lib/packaging-classification";
import type { Classification } from "@/lib/packaging-classification";

const materialImages: Record<string, string> = {
  Plastic: "plastic",
  "Paper/cardboard": "paper",
  Glass: "glass",
  Wood: "wood",
  Metals: "metals",
  "Multi-material": "multi-material",
};

const categoryImages: Record<string, string> = {
  "pet-bottles": "/images/materials/plastic.webp",
  "pet-rigid": "/images/categories/storage-tub.webp",
  "pet-flexible": "/images/categories/foil-pouch.webp",
  "pe-rigid": "/images/categories/rigid-jug.webp",
  "pe-flexible": "/images/categories/spouted-pouch.webp",
  "pp-rigid": "/images/categories/storage-tub.webp",
  "pp-flexible": "/images/categories/foil-pouch.webp",
  "hdpe-pp": "/images/categories/rigid-jug.webp",
  "ps-xps": "/images/categories/foam-tray.webp",
  eps: "/images/categories/eps-block.webp",
  "other-rigid": "/images/categories/rigid-assortment.webp",
  "other-flexible": "/images/categories/film-roll.webp",
  biodegradable: "/images/categories/bio-cups.webp",
};

const materialDescriptions: Record<string, string> = {
  Plastic: "PET, PE, PP, HDPE, LDPE, PVC, PS and other plastic materials.",
  "Paper/cardboard": "Paper, cardboard and composite paper packaging.",
  Glass: "Glass and composite packaging, majority glass.",
  Wood: "Wooden packaging including pallets, crates and boxes.",
  Metals: "Steel, aluminium and other metal packaging.",
  "Multi-material": "Composite packaging with multiple materials.",
};

export default function ComponentClassification({
  importId,
  rowNumber,
  componentId,
  componentName,
  componentImage,
  productName,
  polymer,
  initial,
  canEdit,
  supplierDetails = {},
}: {
  supplierDetails?: Pick<
    CompositionComponent,
    | "foodGrade"
    | "supplierName"
    | "supplierAddress"
    | "supplierContactNumber"
    | "supplierEmail"
    | "supplierAuthorisedPersonName"
  >;
  importId: string;
  rowNumber: number;
  componentId: string;
  componentName: string;
  componentImage?: string;
  productName: string;
  polymer: string;
  initial?: Pick<Classification, "family" | "categoryId">;
  canEdit: boolean;
}) {
  const [family, setFamily] = useState<Classification["family"] | null>(
    initial?.family || null,
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId || "");
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [busy, setBusy] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [savedThisSession, setSavedThisSession] = useState(false);
  const [error, setError] = useState("");
  const reduce = useReducedMotion();
  const categorySearchRef = useRef<HTMLInputElement>(null);
  const emptySearchRef = useRef<HTMLInputElement>(null);
  const categories = packagingCategories.filter(
    (category) =>
      (family === "Multi-material" || category.family === family) &&
      `${category.title} ${category.detail}`
        .toLowerCase()
        .includes(categoryQuery.trim().toLowerCase()),
  );
  useEffect(() => {
    if (
      categories.length > 0 &&
      document.activeElement === emptySearchRef.current
    ) {
      const cursor =
        emptySearchRef.current?.selectionStart ?? categoryQuery.length;
      categorySearchRef.current?.focus({ preventScroll: true });
      categorySearchRef.current?.setSelectionRange(cursor, cursor);
    }
  }, [categories.length, categoryQuery]);
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
      setSavedThisSession(true);
      setStep(3);
      toast.success("Material and packaging category saved.", {
        description: "Your material and packaging category have been saved.",
      });
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className={`composition-builder classification-workspace ${step === 2 ? "classification-category-step" : ""}`}
    >
      <nav className="classification-breadcrumb" aria-label="Breadcrumb">
        <Link href="/dashboard">Workspace</Link>
        <span aria-hidden="true">/</span>
        <span>Component Analysis</span>
        <span aria-hidden="true">/</span>
        <b aria-current="page">{componentName}</b>
      </nav>
      <header className="classification-heading">
        <div>
          <span className="composition-eyebrow">COMPONENT ANALYSIS</span>
          <h1>{componentName}</h1>
          <p>
            {productName} <span>· Polymer: {polymer || "Not provided"}</span>
          </p>
        </div>
        <div className="classification-banner-art component-banner-photo">
          {componentImage ? (
            <img
              src={`/api/packaging-imports/${importId}/assets/${componentImage}`}
              alt={`${componentName} component`}
            />
          ) : (
            <span className="component-banner-placeholder">
              <Package size={72} strokeWidth={1.25} aria-hidden="true" />
              <span className="sr-only">No component photo available</span>
            </span>
          )}
        </div>
        <PackagingBackLink importId={importId} rowNumber={rowNumber} />
      </header>
      <nav
        className="classification-progress classification-progress-four"
        aria-label="Analysis progress"
      >
        <button
          type="button"
          disabled={busy}
          onClick={() => setStep(0)}
          aria-current={step === 0 ? "step" : undefined}
          className={step > 0 ? "classification-step-complete" : undefined}
        >
          <span>{step > 0 ? <Check size={16} /> : "1"}</span>
          <div className="classification-step-copy">
            <b>Supplier details</b>
            <small>Review component supplier</small>
          </div>
        </button>
        <span
          className={`classification-connector ${step > 0 ? "material-completed" : "category-current"}`}
          aria-hidden="true"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setCategoryQuery("");
            setStep(1);
          }}
          className={step >= 2 ? "classification-step-complete" : undefined}
          aria-label={step >= 2 ? "Change material" : undefined}
          aria-current={step === 1 ? "step" : undefined}
        >
          <span>{step >= 2 ? <Check size={16} /> : "2"}</span>
          <div className="classification-step-copy">
            <b>Material</b>
            <small>Select material type</small>
          </div>
        </button>
        <span
          className={`classification-connector ${step > 0 ? "complete" : ""} ${step === 2 ? "material-completed" : ""}`}
          aria-hidden="true"
        />
        <button
          type="button"
          disabled={!family || busy}
          onClick={() => setStep(2)}
          aria-current={step === 2 ? "step" : undefined}
          className={step === 3 ? "classification-step-complete" : undefined}
        >
          <span>{step === 3 ? <Check size={16} /> : "3"}</span>
          <div className="classification-step-copy">
            <b>Packaging category</b>
            <small>Choose packaging category</small>
          </div>
        </button>
        <span
          className={`classification-connector ${step === 3 ? "material-completed" : step === 2 ? "category-current" : ""}`}
          aria-hidden="true"
        />
        <button
          type="button"
          disabled={!categoryId || busy}
          onClick={() => setStep(3)}
          aria-current={step === 3 ? "step" : undefined}
        >
          <span>4</span>
          <div className="classification-step-copy">
            <b>Sustainability Checklist</b>
            <small>Review sustainability requirements</small>
          </div>
        </button>
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
          {step === 3 ? (
            <SustainabilityChecklist
              componentName={componentName}
              onBack={() => setStep(2)}
            />
          ) : step === 0 ? (
            <section
              className="classification-supplier"
              aria-label={`${componentName} supplier details`}
            >
              <div className="classification-intro">
                <span className="classification-intro-icon" aria-hidden="true">
                  <Building2 size={28} />
                </span>
                <div>
                  <h2>Supplier details</h2>
                  <p>
                    Supplier information saved for{" "}
                    <strong>{componentName}</strong> in {productName}.
                  </p>
                </div>
              </div>
              <div className="classification-supplier-card">
                <header>
                  <Building2 size={23} aria-hidden="true" />
                  <div>
                    <h3>
                      {supplierDetails.supplierName || "Supplier not provided"}
                    </h3>
                    <p>{componentName} · Component supplier</p>
                  </div>
                  <span className="composition-count">{componentName}</span>
                </header>
                <dl className="classification-supplier-facts">
                  {(
                    [
                      ["supplierName", "Supplier name"],
                      ["supplierAddress", "Supplier address"],
                      ["supplierContactNumber", "Supplier contact number"],
                      ["supplierEmail", "Supplier email"],
                      [
                        "supplierAuthorisedPersonName",
                        "Supplier authorised person name",
                      ],
                      ["foodGrade", "Food grade"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <dt>{label}</dt>
                      <dd>{supplierDetails[key] || "Not provided"}</dd>
                    </div>
                  ))}
                </dl>
                <footer>
                  <p>
                    Supplier details belong to this component. Update them in
                    the packaging editor.
                  </p>
                  <Button type="button" onClick={() => setStep(1)}>
                    Continue to material <ArrowRight size={17} />
                  </Button>
                </footer>
              </div>
            </section>
          ) : (
            <>
              <div className="classification-intro">
                <span className="classification-intro-icon" aria-hidden="true">
                  <Boxes size={28} />
                </span>
                <div>
                  <h2>
                    {step === 1
                      ? "What material is this component made from?"
                      : "Choose the packaging category"}
                  </h2>
                  <p>
                    {step === 1
                      ? "Select one material to continue. This helps us identify the right packaging category and compliance requirements."
                      : "Select a packaging category that best describes this component."}
                  </p>
                </div>
                {step === 2 && (
                  <label className="category-search">
                    <Search size={20} aria-hidden="true" />
                    <input
                      ref={categorySearchRef}
                      type="search"
                      aria-label="Search packaging category"
                      placeholder="Search packaging category..."
                      value={categoryQuery}
                      onChange={(event) => setCategoryQuery(event.target.value)}
                    />
                  </label>
                )}
              </div>
              {step === 1 ? (
                <div className="material-choice-grid">
                  {materialFamilies.map((material) => (
                    <button
                      type="button"
                      key={material}
                      aria-label={material}
                      className={`material-choice ${family === material ? "selected" : ""}`}
                      aria-pressed={family === material}
                      disabled={busy}
                      onClick={() => {
                        if (material !== family) {
                          setCategoryId("");
                          setSavedThisSession(false);
                        }
                        setFamily(material);
                        setCategoryQuery("");
                        setStep(2);
                        setError("");
                      }}
                    >
                      <span
                        className={`material-photo material-photo-${materialImages[material]}`}
                      >
                        <img
                          src={`/images/materials/${materialImages[material]}.webp`}
                          alt=""
                          width={112}
                          height={112}
                        />
                      </span>
                      <span className="material-choice-copy">
                        <strong>{material}</strong>
                        <small>{materialDescriptions[material]}</small>
                      </span>
                      <span
                        className="material-choice-arrow"
                        aria-hidden="true"
                      >
                        <ChevronRight size={17} />
                      </span>
                      {family === material && (
                        <span className="choice-check">
                          <Check size={16} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  className="category-choice-grid"
                  data-plastic-layout={
                    family === "Plastic" && !categoryQuery.trim()
                  }
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    {categories.map((category) => (
                      <motion.button
                        type="button"
                        key={category.id}
                        layout={reduce ? false : "position"}
                        initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                        whileHover={reduce ? undefined : { y: -4 }}
                        transition={{
                          layout: {
                            duration: reduce ? 0 : 0.3,
                            ease: [0.22, 1, 0.36, 1],
                          },
                          opacity: { duration: reduce ? 0 : 0.2 },
                          y: { duration: reduce ? 0 : 0.25 },
                        }}
                        className={`material-choice category-choice ${categoryId === category.id ? "selected" : ""}`}
                        aria-label={category.title}
                        aria-pressed={categoryId === category.id}
                        disabled={busy || !canEdit}
                        onClick={() => void chooseCategory(category.id)}
                      >
                        <span className="category-photo material-photo">
                          <img
                            src={
                              categoryImages[category.id] ||
                              `/images/materials/${materialImages[category.family]}.webp`
                            }
                            alt=""
                            width={200}
                            height={170}
                          />
                        </span>
                        <span className="category-choice-content">
                          <strong>{category.title}</strong>
                          <small>{category.detail}</small>
                          <span
                            className="category-choice-arrow"
                            aria-hidden="true"
                          >
                            <ArrowRight size={18} />
                          </span>
                        </span>
                        {categoryId === category.id && (
                          <span className="choice-check">
                            <Check size={16} />
                          </span>
                        )}
                      </motion.button>
                    ))}
                    {categories.length === 0 && (
                      <motion.div
                        key="category-empty"
                        className="category-empty"
                        role="region"
                        aria-label="No matching categories"
                        initial={{
                          opacity: 0,
                          y: reduce ? 0 : 20,
                          scale: reduce ? 1 : 0.985,
                        }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: reduce ? 0 : -10 }}
                        transition={{
                          duration: reduce ? 0 : 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <div
                          className="category-empty-ambient"
                          aria-hidden="true"
                        >
                          <img src="/images/materials/paper.webp" alt="" />
                          <img src="/images/materials/plastic.webp" alt="" />
                        </div>
                        <motion.div
                          className="category-empty-art"
                          aria-hidden="true"
                          initial={{ opacity: 0, x: reduce ? 0 : -18 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: reduce ? 0 : 0.5 }}
                        >
                          <img
                            src="/images/categories/empty-search.webp"
                            alt=""
                            width={600}
                            height={600}
                          />
                        </motion.div>
                        <motion.div
                          className="category-empty-copy"
                          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: reduce ? 0 : 0.35,
                            delay: reduce ? 0 : 0.08,
                          }}
                        >
                          <div role="status">
                            <h3>No matching packaging categories</h3>
                            <p>
                              Try another material, polymer or packaging type,
                              or clear your filters to see more results.
                            </p>
                          </div>
                          <label className="category-empty-search">
                            <Search size={22} aria-hidden="true" />
                            <input
                              ref={emptySearchRef}
                              type="search"
                              aria-label="Refine packaging category search"
                              placeholder="Search packaging category..."
                              value={categoryQuery}
                              onChange={(event) =>
                                setCategoryQuery(event.target.value)
                              }
                            />
                          </label>
                          <div className="category-empty-actions">
                            <button
                              type="button"
                              className="category-empty-clear"
                              onClick={() => {
                                setCategoryQuery("");
                                categorySearchRef.current?.focus({
                                  preventScroll: true,
                                });
                              }}
                            >
                              <RotateCcw size={21} aria-hidden="true" />
                              Clear search
                            </button>
                            <button
                              type="button"
                              className="category-empty-adjust"
                              onClick={() => {
                                setCategoryQuery("");
                                setStep(1);
                              }}
                            >
                              <SlidersHorizontal size={21} aria-hidden="true" />
                              Adjust filters
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
          {busy && (
            <p className="classification-saving" role="status">
              <LoaderCircle size={16} className="spin" /> Saving your selection…
            </p>
          )}
          {step === 2 && categoryId && savedThisSession && (
            <div className="classification-saved" role="status">
              <Check size={18} /> Selection saved. Continue to the
              Sustainability Checklist.
              <Button type="button" onClick={() => setStep(3)}>
                Sustainability Checklist <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
