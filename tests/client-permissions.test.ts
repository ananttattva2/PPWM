import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clientOwnerFilter,
  canAccessClient,
  clientEditorRoles,
} from "../src/lib/client-permissions";

test("normal users and managers see only their own clients", () => {
  for (const role of ["user", "manager", "compliance"]) {
    const actor = { id: "krishna", role };
    assert.deepEqual(clientOwnerFilter(actor), { createdBy: "krishna" });
    assert.equal(canAccessClient(actor, { createdBy: "krishna" }), true);
    assert.equal(canAccessClient(actor, { createdBy: "jack" }), false);
    assert.equal(canAccessClient(actor, {}), false);
  }
});
test("only admin and super admin can see all owners", () => {
  for (const role of ["admin", "super_admin"]) {
    const actor = { id: "administrator", role };
    assert.deepEqual(clientOwnerFilter(actor), {});
    assert.equal(canAccessClient(actor, { createdBy: "krishna" }), true);
    assert.equal(canAccessClient(actor, { createdBy: "jack" }), true);
    assert.equal(canAccessClient(actor, {}), true);
  }
});
test("normal users can create/edit, while supplier access stays component-scoped", () => {
  assert.equal((clientEditorRoles as readonly string[]).includes("user"), true);
  assert.equal(
    (clientEditorRoles as readonly string[]).includes("supplier"),
    false,
  );
  assert.equal(
    canAccessClient(
      { id: "supplier", role: "supplier" },
      { createdBy: "supplier" },
    ),
    false,
  );
});

test("company members can access their assigned company but not another company", () => {
  const actor = { id: "member", role: "user", companyId: "company-a" };
  assert.equal(
    canAccessClient(actor, { _id: "company-a", createdBy: "admin" }),
    true,
  );
  assert.equal(
    canAccessClient(actor, { _id: "company-b", createdBy: "admin" }),
    false,
  );
  assert.equal(
    canAccessClient({ ...actor, role: "supplier" }, { _id: "company-a" }),
    false,
  );
});
