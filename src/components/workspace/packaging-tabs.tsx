"use client";
import { useId, useRef, type ReactNode } from "react";
import { Layers3, Package } from "lucide-react";
type Scope = "sales" | "group";
export default function PackagingTabs({
  value,
  onChange,
  disabled = false,
  children,
}: {
  value: Scope;
  onChange: (value: Scope) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const id = useId();
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
          <Layers3 size={17} /> Group Packaging
        </button>
      </div>
      <div
        role="tabpanel"
        id={`${id}-sales`}
        aria-labelledby={`${id}-sales-tab`}
        hidden={value !== "sales"}
      >
        {children}
      </div>
      <div
        role="tabpanel"
        id={`${id}-group`}
        aria-labelledby={`${id}-group-tab`}
        hidden={value !== "group"}
      >
        <div className="group-packaging-placeholder">
          <Layers3 size={36} />
          <h2>Group Packaging</h2>
          <span>Coming soon</span>
          <p>Manage packaging that groups multiple sales units together.</p>
        </div>
      </div>
    </div>
  );
}
