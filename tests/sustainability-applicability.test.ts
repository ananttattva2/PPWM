import { test } from "node:test";
import assert from "node:assert/strict";
import {
  proofNotApplicableReason,
  sustainabilityRequirements,
} from "../src/lib/sustainability-checklist";
import { materialFamilies } from "../src/lib/packaging-classification";

for (const family of materialFamilies) {
  for (const foodGrade of ["Yes", "No"]) {
    test(`${family}, food grade ${foodGrade}: correct proof requirements`, () => {
      const expectedExcluded = [
        ...(family === "Plastic"
          ? []
          : ["recycled", "biobased", "compostable"]),
        ...(foodGrade === "No" ? ["pfas"] : []),
      ];
      for (const requirement of sustainabilityRequirements) {
        assert.equal(
          proofNotApplicableReason(requirement.id, family, foodGrade) !== null,
          expectedExcluded.includes(requirement.id),
          requirement.article,
        );
      }
    });
  }
}

test("missing food grade does not silently exempt PFAS proof", () => {
  assert.equal(proofNotApplicableReason("pfas", "Glass", undefined), null);
  assert.equal(
    proofNotApplicableReason("pfas", "Plastic", " no ") !== null,
    true,
  );
});

test("proof uploads need a saved material selection", () => {
  assert.equal(proofNotApplicableReason("heavy", null, "Yes") !== null, true);
});
