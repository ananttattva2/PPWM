"use client";
import { useId, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import PackagingTabPanel from "./packaging-tab-panel";
import { Layers3, Package } from "lucide-react";
type Scope = "sales" | "group";
function TabBlobs({ filterId }: { filterId: string }) {
  return (
    <span className="packaging-tab-fill" aria-hidden="true">
      <span
        className="packaging-tab-blobs"
        style={{ filter: `url(#${filterId})` }}
      >
        {[0, 1, 2, 3].map((blob) => (
          <span className="packaging-tab-blob" key={blob} />
        ))}
      </span>
    </span>
  );
}
export default function PackagingTabs({
  value,
  onChange,
  disabled = false,
  children,
  groupContent,
}: {
  value: Scope;
  onChange: (value: Scope) => void;
  disabled?: boolean;
  children: ReactNode;
  groupContent: ReactNode;
}) {
  const id = useId();
  const filterId = `packaging-goo-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const reduce = useReducedMotion();
  const sales = useRef<HTMLButtonElement>(null);
  const group = useRef<HTMLButtonElement>(null);
  return (
    <div className="packaging-scopes">
      <svg
        className="packaging-tab-filter"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter
            id={filterId}
            x="-30%"
            y="-50%"
            width="160%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div
        className="packaging-scope-tabs"
        role="tablist"
        aria-label="Packaging type"
        onKeyDown={(event) => {
          if (
            disabled ||
            !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
          )
            return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? "sales"
              : event.key === "End"
                ? "group"
                : value === "sales"
                  ? "group"
                  : "sales";
          onChange(next);
          (next === "sales" ? sales : group).current?.focus();
        }}
      >
        <button
          ref={sales}
          type="button"
          role="tab"
          id={`${id}-sales-tab`}
          aria-controls={`${id}-sales`}
          aria-selected={value === "sales"}
          tabIndex={value === "sales" ? 0 : -1}
          disabled={disabled}
          onClick={() => onChange("sales")}
        >
          {value === "sales" && (
            <motion.span
              className="packaging-tab-highlight"
              layoutId={`${id}-highlight`}
              transition={{
                duration: reduce ? 0 : 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          )}
          <TabBlobs filterId={filterId} />
          <span className="packaging-tab-label">
            <Package size={17} /> Sales Packaging
          </span>
        </button>
        <button
          ref={group}
          type="button"
          role="tab"
          id={`${id}-group-tab`}
          aria-controls={`${id}-group`}
          aria-selected={value === "group"}
          tabIndex={value === "group" ? 0 : -1}
          disabled={disabled}
          onClick={() => onChange("group")}
        >
          {value === "group" && (
            <motion.span
              className="packaging-tab-highlight"
              layoutId={`${id}-highlight`}
              transition={{
                duration: reduce ? 0 : 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          )}
          <TabBlobs filterId={filterId} />
          <span className="packaging-tab-label">
            <Layers3 size={17} /> Group Packaging
          </span>
        </button>
      </div>
      <div className="packaging-panels">
        <PackagingTabPanel
          active={value === "sales"}
          id={`${id}-sales`}
          labelledBy={`${id}-sales-tab`}
        >
          {children}
        </PackagingTabPanel>
        <PackagingTabPanel
          active={value === "group"}
          id={`${id}-group`}
          labelledBy={`${id}-group-tab`}
        >
          {groupContent}
        </PackagingTabPanel>
      </div>
    </div>
  );
}
