import { test } from "node:test";
import assert from "node:assert/strict";
import {
  groupCountKey,
  groupCountsPayload,
  groupPackagingSchema,
  groupReferencesExist,
  groupTotals,
  skuGroupTotal,
} from "../src/lib/group-packaging";
import type { PackagingRow } from "../src/lib/packaging-import-schema";
const rows = [
  {
    rowNumber: 2,
    composition: {
      components: [
        { id: "main", weight: "20" },
        { id: "cap", weight: "2" },
        { id: "sleeve", weight: "1" },
      ],
    },
  },
  { rowNumber: 3, composition: { components: [{ id: "main", weight: "" }] } },
] as PackagingRow[];

test("SKU ratio multiplies groups by whole SKU units and saves separately for each SKU", () => {
  assert.equal(skuGroupTotal("3", "3"), 9);
  assert.equal(skuGroupTotal("4", "6"), 24);
  assert.equal(skuGroupTotal("0", "3"), 0);
  for (const value of ["", "-1", "1.5", "100001", "bad"])
    assert.equal(skuGroupTotal("3", value), null);
  const payload = groupCountsPayload(
    rows,
    {},
    { "2": "3", "3": "2" },
    { "2": "3", "3": "6" },
  );
  assert.deepEqual(payload.groups, [
    { rowNumber: 2, count: 3, unitsPerGroup: 3, components: [] },
    { rowNumber: 3, count: 2, unitsPerGroup: 6, components: [] },
  ]);
  assert.deepEqual(groupPackagingSchema.parse(payload), payload);
  for (const unitsPerGroup of [-1, 1.5, 100001])
    assert.equal(
      groupPackagingSchema.safeParse({
        groups: [{ rowNumber: 2, count: 3, unitsPerGroup, components: [] }],
      }).success,
      false,
    );
});
test("group quantities belong to each SKU and blanks clear prior quantities", () => {
  const payload = groupCountsPayload(rows, {
    "2:main": "6",
    "2:cap": "0",
    "2:sleeve": "",
    "3:main": "12",
    "2:deleted": "5",
  });
  assert.deepEqual(payload, {
    groups: [
      {
        rowNumber: 2,
        components: [
          { componentId: "main", count: 6 },
          { componentId: "cap", count: 0 },
        ],
      },
      { rowNumber: 3, components: [{ componentId: "main", count: 12 }] },
    ],
  });
  assert.equal(groupCountKey(2, "main"), "2:main");
  assert.deepEqual(groupCountsPayload(rows, {}), { groups: [] });
});
test("group save rejects negative, fractional, excessive and duplicate counts", () => {
  for (const count of [-1, 0.5, 100001, NaN])
    assert.equal(
      groupPackagingSchema.safeParse({
        groups: [
          { rowNumber: 2, components: [{ componentId: "main", count }] },
        ],
      }).success,
      false,
    );
  const group = {
    rowNumber: 2,
    components: [{ componentId: "main", count: 6 }],
  };
  assert.equal(
    groupPackagingSchema.safeParse({ groups: [group, group] }).success,
    false,
  );
  assert.equal(
    groupPackagingSchema.safeParse({
      groups: [
        { ...group, components: [group.components[0], group.components[0]] },
      ],
    }).success,
    false,
  );
  assert.equal(
    groupPackagingSchema.safeParse({ groups: [group] }).success,
    true,
  );
});
test("group quantities cannot reference another SKU or removed component", () => {
  assert.equal(
    groupReferencesExist(
      {
        groups: [
          { rowNumber: 2, components: [{ componentId: "cap", count: 6 }] },
        ],
      },
      rows,
    ),
    true,
  );
  assert.equal(
    groupReferencesExist(
      {
        groups: [
          { rowNumber: 3, components: [{ componentId: "cap", count: 6 }] },
        ],
      },
      rows,
    ),
    false,
  );
  assert.equal(
    groupReferencesExist({ groups: [{ rowNumber: 9, components: [] }] }, rows),
    false,
  );
});
test("group totals multiply quantities and do not claim missing weights are known", () => {
  assert.deepEqual(
    groupTotals(rows[0], { "2:main": "6", "2:cap": "6", "2:sleeve": "1" }),
    { count: 13, weight: 133, weightComplete: true },
  );
  assert.deepEqual(groupTotals(rows[1], { "3:main": "2" }), {
    count: 2,
    weight: 0,
    weightComplete: false,
  });
});
test("SKU group counts persist independently and validate whole numbers", () => {
  const payload = groupCountsPayload(rows, {}, { "2": "24", "3": "0" });
  assert.deepEqual(payload, {
    groups: [
      { rowNumber: 2, count: 24, components: [] },
      { rowNumber: 3, count: 0, components: [] },
    ],
  });
  assert.deepEqual(groupPackagingSchema.parse(payload), payload);
  assert.equal(groupReferencesExist(payload, rows), true);
  for (const count of [-1, 1.5, 100001])
    assert.equal(
      groupPackagingSchema.safeParse({
        groups: [{ rowNumber: 2, count, components: [] }],
      }).success,
      false,
    );
  assert.deepEqual(groupCountsPayload(rows, {}, { "2": "" }), { groups: [] });
});
