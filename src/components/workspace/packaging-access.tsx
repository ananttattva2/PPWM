"use client";
import { packagingScopeOptions } from "@/lib/packaging-scopes";
import styles from "./packaging-access.module.css";
export default function PackagingAccess({
  value,
  onChange,
  disabled = false,
}: {
  value: readonly string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend>Packaging access</legend>
      <p>Select one or more packaging types to grant access.</p>
      <div className={styles.options}>
        {packagingScopeOptions.map((option) => (
          <label className={styles.option} key={option.value}>
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...value, option.value]
                    : value.filter((item) => item !== option.value),
                )
              }
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
