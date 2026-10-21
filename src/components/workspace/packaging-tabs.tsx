"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Layers3,
  Package,
  Truck,
  ShoppingBag,
  Coffee,
  Repeat2,
  Milk,
  Boxes,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import PackagingTabPanel from "./packaging-tab-panel";
import type { AdditionalKind } from "@/lib/additional-packaging";
export type PackagingScope = "sales" | "group" | "transport" | AdditionalKind;
const scopes = [
  { key: "sales", label: "Sales Packaging", icon: Package },
  { key: "group", label: "Group Packaging", icon: Layers3 },
  { key: "transport", label: "Transport Packaging", icon: Truck },
  { key: "ecommerce", label: "E-commerce", icon: ShoppingBag },
  { key: "service", label: "Service Packaging", icon: Coffee },
  { key: "reuse", label: "Re-use / Refill", icon: Repeat2 },
  { key: "beverage", label: "Beverage / DRS", icon: Milk },
  { key: "composite", label: "Composite / Multi-material", icon: Boxes },
] as const;
export default function PackagingTabs({
  value,
  onChange,
  disabled = false,
  children,
  groupContent,
  transportContent,
  additionalContent,
}: {
  value: PackagingScope;
  onChange: (value: PackagingScope) => void;
  disabled?: boolean;
  children: ReactNode;
  groupContent: ReactNode;
  transportContent: ReactNode;
  additionalContent: Record<AdditionalKind, ReactNode>;
}) {
  const { scopes: allowed } = useWorkspace();
  const visibleScopes = scopes.filter((scope) => allowed.includes(scope.key));
  const selected = visibleScopes.some((scope) => scope.key === value)
    ? value
    : visibleScopes[0]?.key;
  const id = useId();
  const filterId = `packaging-goo-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const reduce = useReducedMotion();
  const tabList = useRef<HTMLDivElement>(null);
  const buttons = useRef<
    Partial<Record<PackagingScope, HTMLButtonElement | null>>
  >({});
  const contents: Record<PackagingScope, ReactNode> = {
    sales: children,
    group: groupContent,
    transport: transportContent,
    ...additionalContent,
  };
  useEffect(() => {
    const list = tabList.current;
    if (!list) return;
    const reveal = () => {
      const selected = buttons.current[value];
      if (!selected) return;
      const item = selected.getBoundingClientRect();
      const container = list.getBoundingClientRect();
      if (item.left < container.left)
        list.scrollBy({
          left: item.left - container.left - 4,
          behavior: reduce ? "instant" : "smooth",
        });
      else if (item.right > container.right)
        list.scrollBy({
          left: item.right - container.right + 4,
          behavior: reduce ? "instant" : "smooth",
        });
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(list);
    return () => observer.disconnect();
  }, [value, reduce]);
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
        ref={tabList}
        className="packaging-scope-tabs"
        role="tablist"
        aria-label="Packaging type"
        onKeyDown={(event) => {
          if (
            disabled ||
            !visibleScopes.length ||
            !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
          )
            return;
          event.preventDefault();
          const index = visibleScopes.findIndex(
            (scope) => scope.key === selected,
          );
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? visibleScopes.length - 1
                : (index +
                    (event.key === "ArrowRight" ? 1 : -1) +
                    visibleScopes.length) %
                  visibleScopes.length;
          const scope = visibleScopes[next].key;
          onChange(scope);
          buttons.current[scope]?.focus();
          buttons.current[scope]?.scrollIntoView({
            block: "nearest",
            inline: "nearest",
            behavior: reduce ? "instant" : "smooth",
          });
        }}
      >
        {visibleScopes.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            ref={(node) => {
              buttons.current[key] = node;
            }}
            type="button"
            role="tab"
            id={`${id}-${key}-tab`}
            aria-controls={`${id}-${key}`}
            aria-selected={selected === key}
            tabIndex={selected === key ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(key)}
          >
            {selected === key && (
              <motion.span
                className="packaging-tab-highlight"
                layoutId={`${id}-highlight`}
                transition={{
                  duration: reduce ? 0 : 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            )}
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
            <span className="packaging-tab-label">
              <Icon size={17} aria-hidden="true" />
              {label}
            </span>
          </button>
        ))}
      </div>
      <div className="packaging-panels">
        {visibleScopes.map(({ key }) => (
          <PackagingTabPanel
            key={key}
            active={selected === key}
            id={`${id}-${key}`}
            labelledBy={`${id}-${key}-tab`}
          >
            {contents[key]}
          </PackagingTabPanel>
        ))}
      </div>
    </div>
  );
}
