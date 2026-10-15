import { test } from "node:test";
import assert from "node:assert/strict";
import { validProofSignature } from "../src/lib/sustainability-proof";
test("proof validation accepts supported signatures and rejects mismatched files", () => {
  const encode = (text: string) => new TextEncoder().encode(text);
  assert.equal(
    validProofSignature("application/pdf", encode("%PDF-1.7")),
    true,
  );
  assert.equal(
    validProofSignature(
      "image/png",
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    ),
    true,
  );
  assert.equal(
    validProofSignature("image/jpeg", new Uint8Array([255, 216, 255])),
    true,
  );
  assert.equal(validProofSignature("image/webp", encode("RIFFxxxxWEBP")), true);
  for (const type of [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
  ]) {
    assert.equal(
      validProofSignature(type, encode("<script>bad</script>")),
      false,
    );
    assert.equal(validProofSignature(type, new Uint8Array()), false);
  }
});
