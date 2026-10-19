export function calculateHeavyMetals(values: string[]) {
  const cleaned = values.map((value) => value.trim());
  if (
    !cleaned.length ||
    cleaned.some((value) => !/^\d{1,18}(?:\.\d{1,12})?$/.test(value))
  )
    return null;
  const places = Math.max(
    ...cleaned.map((value) => value.split(".")[1]?.length || 0),
  );
  const scale = 10n ** BigInt(places);
  const total = cleaned.reduce((sum, value) => {
    const [whole, fraction = ""] = value.split(".");
    return (
      sum + BigInt(whole) * scale + BigInt(fraction.padEnd(places, "0") || "0")
    );
  }, 0n);
  const whole = total / scale;
  const fraction = places
    ? (total % scale).toString().padStart(places, "0").replace(/0+$/, "")
    : "";
  return {
    total: `${whole}${fraction ? `.${fraction}` : ""}`,
    exceeds: total > 100n * scale,
  };
}
