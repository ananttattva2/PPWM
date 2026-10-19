import { test } from "node:test";
import assert from "node:assert/strict";
import {
  additionalPackagingSchema,
  detailSummary,
  type AdditionalPackagingData,
} from "../src/lib/additional-packaging";

const base = (
  kind: AdditionalPackagingData["kind"],
): AdditionalPackagingData => ({
  kind,
  rowNumber: 2,
  used: "yes",
  name: "Test",
  fields: {},
  attachments: {},
  components: [
    {
      id: "box",
      name: "Box",
      material: "Paperboard",
      quantity: 1,
      weight: 180,
    },
    {
      id: "filler",
      name: "Filler",
      material: "Paper",
      quantity: 1,
      weight: 25,
    },
    { id: "tape", name: "Tape", material: "Paper", quantity: 1, weight: 5 },
  ],
});
test("ecommerce computes per-order packaging, shipping mass and internal volume", () => {
  const data = base("ecommerce");
  data.fields = { orders: 100, length: 25, width: 20, height: 15 };
  const summary = detailSummary(data);
  assert.equal(summary.weight, 210);
  assert.equal(summary.totalKg, 21);
  assert.equal(summary.volume, 7500);
});
test("service quantities and reuse pool mass use their correct denominators", () => {
  const data = base("service");
  data.fields.servings = 500;
  data.components = [
    { id: "cup", name: "Cup", material: "Paper", quantity: 1, weight: 10 },
    { id: "lid", name: "Lid", material: "PP", quantity: 1, weight: 3 },
  ];
  assert.equal(detailSummary(data).totalKg, 6.5);
  data.kind = "reuse";
  data.components = [
    {
      id: "bottle",
      name: "Bottle",
      material: "Glass",
      quantity: 1000,
      weight: 300,
    },
  ];
  assert.equal(detailSummary(data).weight / 1000, 300);
  data.used = "no";
  assert.equal(detailSummary(data).weight, 0);
});
test("composite reports actual material weights without claiming a legal classification", () => {
  const data = base("composite");
  data.components = [
    {
      id: "paper",
      name: "Outer",
      material: "Paperboard",
      quantity: 1,
      weight: 22.5,
    },
    { id: "pe", name: "Inner", material: "PE", quantity: 1, weight: 6 },
    {
      id: "al",
      name: "Barrier",
      material: "Aluminium",
      quantity: 1,
      weight: 1.5,
    },
  ];
  assert.equal(detailSummary(data).materialWeight, 30);
  assert.equal(detailSummary(data).main, "Paperboard");
});
test("schema rejects invalid quantities, cross-kind fields, file slots and negative values", () => {
  const data = base("ecommerce");
  assert.ok(additionalPackagingSchema.safeParse(data).success);
  data.fields.orders = 1.5;
  assert.ok(!additionalPackagingSchema.safeParse(data).success);
  data.fields = { servings: 10 };
  assert.ok(!additionalPackagingSchema.safeParse(data).success);
  data.fields = {};
  data.components[0].weight = -1;
  assert.ok(!additionalPackagingSchema.safeParse(data).success);
});
