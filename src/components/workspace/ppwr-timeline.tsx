"use client";
import { useRef, useState, type CSSProperties } from "react";
import { Modal } from "@mantine/core";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ExternalLink,
  FileCheck2,
  Building2,
  Recycle,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  PPWR_SOURCE,
  ppwrTimeline,
  type TimelineMilestone,
} from "@/lib/ppwr-timeline";

function Milestone({
  item,
  lane,
  index,
}: {
  item: TimelineMilestone;
  lane: "commission" | "business";
  index: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.details
      className={`ppwr-milestone ${lane}`}
      initial={
        reduce ? false : { opacity: 0, y: lane === "commission" ? -10 : 10 }
      }
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: reduce ? 0 : 0.4,
        delay: reduce ? 0 : Math.min(index * 0.05, 0.2),
      }}
    >
      <summary>
        <span className="ppwr-milestone-date">
          <CalendarDays size={12} aria-hidden="true" />
          {item.date}
        </span>
        <div className="ppwr-milestone-title">
          {lane === "commission" ? (
            <FileCheck2 size={19} aria-hidden="true" />
          ) : (
            <Recycle size={19} aria-hidden="true" />
          )}
          <h4>{item.title}</h4>
        </div>
        <span className="ppwr-article-reference">
          {item.article}
          <span aria-hidden="true"> +</span>
        </span>
      </summary>
      <a
        href={PPWR_SOURCE}
        target="_blank"
        rel="noreferrer"
        aria-label={`${item.article}: ${item.title}, official regulation`}
      >
        {item.article}
        <ExternalLink size={11} aria-hidden="true" />
      </a>
      <p>{item.detail}</p>
    </motion.details>
  );
}

export default function PpwrTimeline() {
  const [opened, setOpened] = useState(false);
  const [view, setView] = useState<"all" | "commission" | "business">("all");
  const [activeYear, setActiveYear] = useState(2026);
  const viewport = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  function goTo(year: number) {
    setActiveYear(year);
    const column = viewport.current?.querySelector<HTMLElement>(
      `[data-year="${year}"]`,
    );
    if (column && viewport.current)
      viewport.current.scrollTo({
        left: column.offsetLeft - viewport.current.offsetLeft - 16,
        behavior: reduce ? "instant" : "smooth",
      });
  }
  return (
    <>
      <Button variant="outline" onClick={() => setOpened(true)}>
        <CalendarDays size={18} aria-hidden="true" />
        Full PPWR Timeline
      </Button>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        fullScreen
        title="Full PPWR Timeline"
        classNames={{
          content: "ppwr-timeline-modal",
          header: "ppwr-modal-header",
          body: "ppwr-modal-body",
        }}
        transitionProps={{ transition: "fade", duration: reduce ? 0 : 220 }}
        closeButtonProps={{ "aria-label": "Close PPWR timeline" }}
      >
        <div className="ppwr-timeline">
          <header className="ppwr-timeline-hero">
            <span className="ppwr-hero-icon">
              <Recycle size={32} aria-hidden="true" />
            </span>
            <div>
              <span className="ppwr-eyebrow">
                REGULATION (EU) 2025/40 · 2026–2040
              </span>
              <h2>Your roadmap to packaging compliance.</h2>
              <p>
                Sustainability requirements, Commission acts and business
                deadlines for packaging.
              </p>
            </div>
            <a href={PPWR_SOURCE} target="_blank" rel="noreferrer">
              Official regulation <ExternalLink size={15} aria-hidden="true" />
            </a>
          </header>
          <div className="ppwr-timeline-toolbar">
            <div
              className="ppwr-view-switch"
              role="group"
              aria-label="Timeline tracks"
            >
              {(
                [
                  ["all", "Full timeline"],
                  ["commission", "Commission"],
                  ["business", "Businesses"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={view === key}
                  onClick={() => setView(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="ppwr-scroll-controls">
              <span>Explore 2026–2040</span>
              <button
                type="button"
                aria-label="Scroll timeline left"
                onClick={() =>
                  viewport.current?.scrollBy({
                    left: -500,
                    behavior: reduce ? "instant" : "smooth",
                  })
                }
              >
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Scroll timeline right"
                onClick={() =>
                  viewport.current?.scrollBy({
                    left: 500,
                    behavior: reduce ? "instant" : "smooth",
                  })
                }
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <nav
            className="ppwr-year-navigation"
            aria-label="Jump to timeline year"
          >
            {ppwrTimeline.map(({ year, color }) => (
              <button
                type="button"
                key={year}
                style={{ "--year-color": color } as CSSProperties}
                aria-current={activeYear === year ? "true" : undefined}
                onClick={() => goTo(year)}
              >
                {year}
              </button>
            ))}
          </nav>
          <div className="ppwr-track-legend">
            <span>
              <FileCheck2 size={17} aria-hidden="true" />
              Commission · delegated acts, implementing acts & reviews
            </span>
            <span>
              <Building2 size={17} aria-hidden="true" />
              Businesses & Member States · requirements & targets
            </span>
          </div>
          <div
            className={`ppwr-timeline-viewport view-${view}`}
            ref={viewport}
            tabIndex={0}
            role="region"
            aria-label="PPWR timeline, horizontally scrollable"
          >
            <div className="ppwr-timeline-board">
              {ppwrTimeline.map(({ year, color, commission, business }) => (
                <section
                  key={year}
                  data-year={year}
                  className="ppwr-year-column"
                  style={{ "--year-color": color } as CSSProperties}
                  aria-label={`${year} milestones`}
                >
                  {view !== "business" && (
                    <div className="ppwr-track ppwr-commission-track">
                      <h3 className="sr-only">{year} Commission milestones</h3>
                      {commission.length ? (
                        commission.map((item, index) => (
                          <Milestone
                            key={item.title}
                            item={item}
                            lane="commission"
                            index={index}
                          />
                        ))
                      ) : (
                        <p className="ppwr-track-quiet">
                          No Commission milestone listed for this year.
                        </p>
                      )}
                    </div>
                  )}
                  <div className="ppwr-year-axis">
                    <span>{year}</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </div>
                  {view !== "commission" && (
                    <div className="ppwr-track ppwr-business-track">
                      <h3 className="sr-only">
                        {year} business & Member State milestones
                      </h3>
                      {business.length ? (
                        business.map((item, index) => (
                          <Milestone
                            key={item.title}
                            item={item}
                            lane="business"
                            index={index}
                          />
                        ))
                      ) : (
                        <p className="ppwr-track-quiet">
                          No business milestone listed for this year.
                        </p>
                      )}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
          <footer className="ppwr-timeline-footer">
            <p>
              <b>How to read this timeline</b> · Dates are statutory milestones,
              not confirmation that an act has been adopted. “Or later” dates
              depend on secondary legislation. Scope, exemptions and transition
              periods apply.
            </p>
            <a href={PPWR_SOURCE} target="_blank" rel="noreferrer">
              Source: Regulation (EU) 2025/40{" "}
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </footer>
        </div>
      </Modal>
    </>
  );
}
