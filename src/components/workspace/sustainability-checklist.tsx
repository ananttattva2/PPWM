"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import { sustainabilityRequirements } from "@/lib/sustainability-checklist";
import { Button } from "../ui/button";
export default function SustainabilityChecklist({
  componentName,
  onBack,
}: {
  componentName: string;
  onBack: () => void;
}) {
  const reduce = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      className="sustainability-checklist"
      aria-labelledby="sustainability-heading"
    >
      <header className="sustainability-checklist-heading">
        <div>
          <h2 id="sustainability-heading" ref={heading} tabIndex={-1}>
            Sustainability Checklist
          </h2>
          <p>
            Packaging sustainability requirements for{" "}
            <strong>{componentName}</strong>.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft size={16} />
          Packaging category
        </Button>
      </header>
      <div className="sustainability-checklist-grid">
        {sustainabilityRequirements.map((item, index) => (
          <motion.article
            key={item.id}
            className={`sustainability-card sustainability-card-${item.id}`}
            style={{ "--check-accent": item.accent } as CSSProperties}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            whileHover={reduce ? undefined : { y: -5 }}
            transition={{
              duration: reduce ? 0 : 0.4,
              delay: reduce ? 0 : Math.min(index * 0.045, 0.2),
              ease: [0.22, 1, 0.36, 1],
            }}
            aria-labelledby={`sustainability-${item.id}`}
          >
            <span className="sustainability-card-orb" aria-hidden="true" />
            <img
              className="sustainability-card-art"
              src={`/images/sustainability/${item.id}.webp`}
              alt=""
              width={420}
              height={420}
              loading={index < 3 ? "eager" : "lazy"}
            />
            <div className="sustainability-card-heading">
              <span className="sustainability-card-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 id={`sustainability-${item.id}`}>{item.title}</h3>
            </div>
            <p className="sustainability-card-description">
              {item.description}
            </p>
            <ul className="sustainability-card-points">
              {item.bullets.map((point) => (
                <li key={point}>
                  <span className="sustainability-bullet" aria-hidden="true">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <span className="sustainability-card-article">{item.article}</span>
          </motion.article>
        ))}
      </div>
      <footer className="sustainability-checklist-footer">
        <p>
          Requirements overview · Scope, exemptions and application dates depend
          on the packaging and relevant implementing acts.
        </p>
        <a
          href="https://eur-lex.europa.eu/eli/reg/2025/40/oj"
          target="_blank"
          rel="noreferrer"
        >
          Regulation (EU) 2025/40 <ExternalLink size={14} />
        </a>
      </footer>
    </section>
  );
}
