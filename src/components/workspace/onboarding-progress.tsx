"use client";
import { Check } from "lucide-react";
import { motion } from "motion/react";
const steps = [
  ["Organisation", "Identity & documents"],
  ["Packaging", "Import & validate"],
  ["Review", "Check & create"],
];
export default function OnboardingProgress({
  active,
  onBack,
}: {
  active: number;
  onBack: (index: number) => void;
}) {
  return (
    <nav className="onboarding-progress" aria-label="Onboarding progress">
      <ol>
        {steps.map(([label, hint], index) => (
          <li
            key={label}
            className={
              index === active ? "current" : index < active ? "completed" : ""
            }
            aria-current={index === active ? "step" : undefined}
          >
            <button
              type="button"
              disabled={index >= active}
              onClick={() => onBack(index)}
              aria-label={`Go back to ${label}`}
            >
              <span className="progress-number">
                <motion.span
                  key={`${index}-${index < active}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {index < active ? <Check size={16} /> : index + 1}
                </motion.span>
              </span>
              <span className="progress-copy">
                <b>{label}</b>
                <small>{hint}</small>
              </span>
            </button>
            {index < 2 && (
              <span className="progress-connector">
                <motion.span
                  initial={false}
                  animate={{ width: index < active ? "100%" : "0%" }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                />
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
