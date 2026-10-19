"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Recycle,
  RefreshCw,
  Leaf,
  Sprout,
  Minimize2,
  Repeat2,
  Tags,
} from "lucide-react";
import { Button } from "../ui/button";
import styles from "./packaging-articles.module.css";

const articles = [
  {
    number: 5,
    title: "Requirements for substances in packaging",
    icon: ShieldCheck,
    color: "#ed781f",
    topic: "Substances",
  },
  {
    number: 6,
    title: "Recyclable packaging",
    icon: Recycle,
    color: "#239c69",
    topic: "Recyclability",
  },
  {
    number: 7,
    title: "Minimum recycled content in plastic packaging",
    icon: RefreshCw,
    color: "#3684df",
    topic: "Recycled content",
  },
  {
    number: 8,
    title: "Biobased feedstock in plastic packaging",
    icon: Leaf,
    color: "#8b62d5",
    topic: "Biobased feedstock",
  },
  {
    number: 9,
    title: "Compostable packaging",
    icon: Sprout,
    color: "#6d9b32",
    topic: "Compostability",
  },
  {
    number: 10,
    title: "Packaging minimisation",
    icon: Minimize2,
    color: "#d79522",
    topic: "Resource efficiency",
  },
  {
    number: 11,
    title: "Reusable packaging",
    icon: Repeat2,
    color: "#159eaa",
    topic: "Reuse",
  },
  {
    number: 12,
    title: "Labelling of packaging",
    icon: Tags,
    color: "#d6578a",
    topic: "Labelling",
  },
] as const;

export default function PackagingArticles({
  componentName,
  onBack,
  onContinue,
  importId,
  rowNumber,
  componentId,
  scope = "component",
  articleHref,
}: {
  componentName: string;
  onBack: () => void;
  onContinue?: () => void;
  importId: string;
  rowNumber: number;
  componentId?: string;
  scope?: "component" | "sku";
  articleHref?: (number: number) => string;
}) {
  const reduce = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      className={styles.articles}
      aria-labelledby="packaging-articles-heading"
    >
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>
            PACKAGING REQUIREMENTS · ARTICLES 5–12
          </span>
          <h2 id="packaging-articles-heading" ref={heading} tabIndex={-1}>
            Articles
          </h2>
          <p>
            {scope === "sku"
              ? "Select an article to review the packaging requirements for "
              : "Explore the packaging articles before reviewing the Sustainability Checklist for "}
            <strong>{componentName}</strong>.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft size={16} />{" "}
          {scope === "sku" ? "SKU overview" : "Packaging category"}
        </Button>
      </header>
      <div className={styles.grid}>
        {articles.map(({ number, title, icon: Icon, color, topic }, index) => {
          const content = (
            <>
              <span className={styles.orb} aria-hidden="true" />
              <div className={styles.cardTop}>
                <span className={styles.icon}>
                  <Icon size={29} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <span className={styles.badge}>Article {number}</span>
              </div>
              <span className={styles.topic}>{topic}</span>
              <h3>{title}</h3>
              <div className={styles.cardBottom}>
                <span>
                  ARTICLE <b>{String(number).padStart(2, "0")}</b>
                </span>
                <span className={styles.line} aria-hidden="true" />
                {(number === 5 || articleHref) && (
                  <ArrowRight
                    className={styles.openIcon}
                    size={18}
                    aria-hidden="true"
                  />
                )}
              </div>
            </>
          );
          return (
            <motion.div
              key={number}
              style={{ "--article-accent": color } as CSSProperties}
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              whileHover={reduce ? undefined : { y: -6 }}
              transition={{
                duration: reduce ? 0 : 0.4,
                delay: reduce ? 0 : index * 0.045,
              }}
              className={styles.cardMotion}
            >
              {number === 5 || articleHref ? (
                <Link
                  className={`${styles.card} ${styles.clickable}`}
                  href={
                    articleHref
                      ? articleHref(number)
                      : `/dashboard/packaging/${importId}/${rowNumber}/article-5?component=${encodeURIComponent(componentId || "")}`
                  }
                  aria-label={`Open Article ${number} assessment for ${componentName}`}
                >
                  {content}
                </Link>
              ) : (
                <article className={styles.card}>{content}</article>
              )}
            </motion.div>
          );
        })}
      </div>
      {scope === "component" && onContinue && (
        <footer className={styles.footer}>
          <div>
            <strong>Ready to review your component?</strong>
            <p>
              Continue to the sustainability requirements and supporting proofs.
            </p>
          </div>
          <Button type="button" onClick={onContinue}>
            Sustainability Checklist <ArrowRight size={17} />
          </Button>
        </footer>
      )}
    </section>
  );
}
