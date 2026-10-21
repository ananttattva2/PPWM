import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allowedPackagingScopes,
  assertPackagingScope,
  packagingScopes,
} from "../src/lib/packaging-scopes";
test("multiple packaging scopes are enforced and unknown values cannot grant access", () => {
  const member = {
    role: "user",
    packagingScopes: ["group", "transport", "unknown"],
  };
  assert.deepEqual(allowedPackagingScopes(member), ["group", "transport"]);
  assert.doesNotThrow(() => assertPackagingScope(member, "group"));
  assert.throws(() => assertPackagingScope(member, "sales"), /FORBIDDEN/);
  assert.deepEqual(
    allowedPackagingScopes({ role: "user", packagingScopes: [] }),
    [],
  );
});
test("admins retain all packaging permissions; legacy users keep their existing access", () => {
  assert.deepEqual(
    allowedPackagingScopes({ role: "admin", packagingScopes: ["group"] }),
    packagingScopes,
  );
  assert.deepEqual(
    allowedPackagingScopes({ role: "super_admin", packagingScopes: [] }),
    packagingScopes,
  );
  assert.deepEqual(allowedPackagingScopes({ role: "user" }), packagingScopes);
});
