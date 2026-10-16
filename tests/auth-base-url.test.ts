import { test } from "node:test";
import assert from "node:assert/strict";
import { authBaseURL } from "../src/lib/auth-base-url";

test("local auth accepts both app ports regardless of the configured local port", () => {
  for (const configured of [
    "http://localhost:3000",
    "http://localhost:7000",
    "http://127.0.0.1:7000",
  ]) {
    const result = authBaseURL(configured);
    assert.notEqual(typeof result, "string");
    if (typeof result === "string") return;
    assert.equal(result.protocol, "http");
    assert.ok(result.allowedHosts.includes("localhost:3000"));
    assert.ok(result.allowedHosts.includes("localhost:7000"));
    assert.equal(result.allowedHosts.includes("evil.example.com"), false);
  }
});
test("hosted authentication retains its explicit origin", () => {
  assert.equal(
    authBaseURL("https://ppwm.example.com"),
    "https://ppwm.example.com",
  );
});
