import { test } from "node:test";
import assert from "node:assert/strict";
import { createOTPEmail } from "../src/lib/otp-email";
import { emailLogoBase64 } from "../src/lib/email-logo";
test("OTP template includes code, expiry, brand CID and Outlook fallback", () => {
  const output = createOTPEmail({ email: "demo@example.com", otp: "123456" });
  assert.ok(output.html.includes("123456"));
  assert.ok(output.html.includes("5 minutes"));
  assert.ok(output.html.includes("cid:anant-tattva-logo"));
  assert.ok(output.html.includes("<!--[if mso]>"));
  assert.ok(output.subject.includes("sign-in"));
  assert.ok(
    Buffer.from(emailLogoBase64, "base64")
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  );
});
test("password-reset and email verification use correct copy", () => {
  const reset = createOTPEmail({
    email: "demo@example.com",
    otp: "123456",
    purpose: "forget-password",
  });
  assert.ok(reset.html.includes("Reset your password securely"));
  assert.ok(reset.subject.includes("password reset"));
  const verification = createOTPEmail({
    email: "demo@example.com",
    otp: "123456",
    purpose: "email-verification",
  });
  assert.ok(verification.html.includes("Verify your email address"));
});
test("recipient text is escaped and only public HTTPS workspace links are rendered", () => {
  const output = createOTPEmail({
    email: '<script>alert("x")</script>',
    otp: "123456",
    workspaceURL: "http://localhost:3000",
  });
  assert.ok(output.html.includes("&lt;script&gt;"));
  assert.ok(!output.html.includes("<script>"));
  assert.ok(!output.html.includes('href="http://localhost'));
  const publicEmail = createOTPEmail({
    email: "demo@example.com",
    otp: "123456",
    workspaceURL: "https://workspace.example.com",
  });
  assert.ok(
    publicEmail.html.includes('href="https://workspace.example.com/login"'),
  );
  const unsafe = createOTPEmail({
    email: "demo@example.com",
    otp: "123456",
    workspaceURL: "javascript:alert(1)",
  });
  assert.ok(!unsafe.html.includes("javascript:"));
});
test("invalid OTP values cannot be rendered", () => {
  for (const otp of ["12345", "1234567", "<h1>x", "abcdef"])
    assert.throws(
      () => createOTPEmail({ email: "demo@example.com", otp }),
      /exactly six digits/,
    );
});
