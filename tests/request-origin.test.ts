import { test } from "node:test";
import assert from "node:assert/strict";
import { sameRequestOrigin } from "../src/lib/request-origin";

test("same-origin writes work directly and through the 7000 port alias", () => {
  for (const port of [3000, 7000]) {
    assert.equal(
      sameRequestOrigin(
        new Request("http://localhost:3000/api/test", {
          headers: {
            host: `localhost:${port}`,
            origin: `http://localhost:${port}`,
          },
        }),
      ),
      true,
    );
  }
});
test("foreign origins, missing origins and mismatched ports stay blocked", () => {
  for (const origin of [
    "https://evil.example",
    "null",
    "http://localhost:3000",
    "",
  ]) {
    assert.equal(
      sameRequestOrigin(
        new Request("http://localhost:3000/api/test", {
          headers: { host: "localhost:7000", origin },
        }),
      ),
      false,
    );
  }
});
