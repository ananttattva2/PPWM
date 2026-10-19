import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateHeavyMetals } from "../src/lib/heavy-metal-calculator";

test("exactly 100 mg/kg passes with either input method", () => {
  assert.deepEqual(calculateHeavyMetals(["25", "25", "25", "25"]), { total: "100", exceeds: false });
  assert.deepEqual(calculateHeavyMetals(["100.000"]), { total: "100", exceeds: false });
});
test("decimal sums preserve the exact threshold boundary", () => {
  assert.deepEqual(calculateHeavyMetals(["99.7", "0.1", "0.1", "0.1"]), { total: "100", exceeds: false });
  assert.deepEqual(calculateHeavyMetals(["100.000000000001"]), { total: "100.000000000001", exceeds: true });
  assert.deepEqual(calculateHeavyMetals(["99.999999999999"]), { total: "99.999999999999", exceeds: false });
});
test("missing, negative, non-finite and unsupported concentrations remain pending", () => {
  for (const value of ["", " ", "-1", "NaN", "Infinity", "1e2", "<0.1", "0.0000000000001"]) assert.equal(calculateHeavyMetals([value]), null);
  assert.equal(calculateHeavyMetals(["1", "2", "", "4"]), null);
  assert.equal(calculateHeavyMetals([]), null);
  assert.deepEqual(calculateHeavyMetals(["0", "0", "0", "0"]), { total: "0", exceeds: false });
});
