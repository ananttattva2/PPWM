"use client";
import { useId, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import PackagingTabPanel from "./packaging-tab-panel";
import { Layers3, Package } from "lucide-react";
type Scope = "sales" | "group";
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
  const reduce = useReducedMotion();
  const sales = useRef<HTMLButtonElement>(null);
  const group = useRef<HTMLButtonElement>(null);
  return (
    <div className="packaging-scopes">
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
          <Package size={17} /> Sales Packaging
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
          <Layers3 size={17} /> Group Packaging
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
