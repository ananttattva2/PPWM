import { test } from "node:test";
import assert from "node:assert/strict";
import { validMediaSignature } from "../src/lib/media-types";
test("spreadsheet, document and video headers are recognized without accepting mismatches", () => {
  const zip = new Uint8Array([80, 75, 3, 4]);
  assert.ok(
    validMediaSignature(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      zip,
    ),
  );
  assert.ok(
    validMediaSignature(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      zip,
    ),
  );
  assert.ok(
    validMediaSignature(
      "application/vnd.ms-excel",
      new Uint8Array([208, 207, 17, 224, 161, 177, 26, 225]),
    ),
  );
  assert.ok(
    validMediaSignature(
      "video/mp4",
      new Uint8Array([0, 0, 0, 20, 102, 116, 121, 112]),
    ),
  );
  assert.ok(
    validMediaSignature("video/webm", new Uint8Array([26, 69, 223, 163])),
  );
  assert.ok(
    validMediaSignature(
      "text/csv",
      new TextEncoder().encode("name,weight\nSKU,10"),
    ),
  );
  assert.equal(
    validMediaSignature("text/csv", new Uint8Array([0, 12, 10])),
    false,
  );
  assert.equal(validMediaSignature("video/mp4", zip), false);
  assert.equal(validMediaSignature("application/vnd.ms-excel", zip), false);
  assert.equal(
    validMediaSignature("image/svg+xml", new TextEncoder().encode("<svg/>")),
    false,
  );
});
