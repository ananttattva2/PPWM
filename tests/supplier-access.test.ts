import { test } from "node:test";
import assert from "node:assert/strict";
import {
  supplierRows,
  supplierOwnsComponent,
  supplierCanReadAsset,
} from "../src/lib/supplier-access";
import { provisionSupplierLogin } from "../src/lib/supplier-login";
import { analysePackaging } from "../src/lib/packaging-import";
import { initialComposition } from "../src/lib/packaging-composition";

const row = analysePackaging(
  [
    {
      SKU: "S1",
      Product: "Water",
      Category: "Beverages",
      Type: "Bottle",
      Weight: "23",
      Components: "2",
    },
  ],
  {
    sku: "SKU",
    productName: "Product",
    category: "Category",
    packagingType: "Type",
    weight: "Weight",
    components: "Components",
  },
  {
    category: "All Categories",
    plant: "All Plants",
    firstRow: "headers",
    updateExisting: true,
  },
).rows[0];
const base = initialComposition(row);
row.composition = {
  ...base,
  productImage: "product-photo",
  productImages: [],
  components: [
    {
      ...base.components[0],
      id: "bottle",
      name: "Bottle",
      supplierEmail: " KrishnaSupplier@gmail.com ",
      image: "bottle-photo",
    },
    {
      ...base.components[0],
      id: "cap",
      name: "Cap",
      supplierEmail: "jacksupplier@gmail.com",
      image: "cap-photo",
    },
  ],
};
row.supplierEmail = "private-owner@example.com";
row.issues = [
  {
    row: 1,
    sku: "S1",
    field: "supplierEmail",
    message: "Private owner details",
    kind: "missing",
  },
];

test("Krishna sees Bottle only; Jack sees Cap only; unknown email sees nothing", () => {
  assert.deepEqual(
    supplierRows(
      [row],
      "krishnasupplier@gmail.com",
    )[0].composition!.components.map((component) => component.name),
    ["Bottle"],
  );
  assert.deepEqual(
    supplierRows(
      [row],
      "JACKSUPPLIER@gmail.com",
    )[0].composition!.components.map((component) => component.name),
    ["Cap"],
  );
  assert.deepEqual(supplierRows([row], "unknown@gmail.com"), []);
  assert.equal(row.composition!.components.length, 2);
});
test("supplier data excludes owner supplier details and validation messages", () => {
  const filtered = supplierRows([row], "jacksupplier@gmail.com")[0];
  assert.equal(filtered.supplierEmail, undefined);
  assert.deepEqual(filtered.issues, []);
  assert.equal(JSON.stringify(filtered).includes("krishnasupplier"), false);
});
test("supplier cannot read another component photo, even with a guessed asset ID", () => {
  assert.equal(
    supplierCanReadAsset([row], "krishnasupplier@gmail.com", "bottle-photo"),
    true,
  );
  assert.equal(
    supplierCanReadAsset([row], "krishnasupplier@gmail.com", "cap-photo"),
    false,
  );
  assert.equal(
    supplierCanReadAsset([row], "jacksupplier@gmail.com", "product-photo"),
    true,
  );
  assert.equal(
    supplierCanReadAsset([row], "stranger@gmail.com", "product-photo"),
    false,
  );
});
test("blank supplier emails never grant access", () => {
  assert.equal(supplierOwnsComponent("", { supplierEmail: "" }), false);
  assert.equal(supplierOwnsComponent("supplier@gmail.com", {}), false);
});
test("assigned email gets a supplier account, without granting staff privileges", async () => {
  let account: unknown;
  await provisionSupplierLogin(" JACKSUPPLIER@gmail.com ", {
    findUser: async () => null,
    hasAssignments: async (email) => email === "jacksupplier@gmail.com",
    createUser: async (value) => {
      account = value;
    },
  });
  assert.deepEqual(account, {
    email: "jacksupplier@gmail.com",
    name: "jacksupplier",
    emailVerified: false,
    role: "supplier",
    active: true,
  });
});
test("unassigned email cannot sign up; existing and deactivated users are not overwritten", async () => {
  for (const existing of [
    null,
    { role: "admin" },
    { role: "supplier", active: false },
  ]) {
    let created = false;
    await provisionSupplierLogin("user@gmail.com", {
      findUser: async () => existing,
      hasAssignments: async () => false,
      createUser: async () => {
        created = true;
      },
    });
    assert.equal(created, false);
  }
});
