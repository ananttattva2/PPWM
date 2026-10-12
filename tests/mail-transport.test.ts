import { test } from "node:test";
import assert from "node:assert/strict";
import { sendOTP } from "../src/lib/mail";
test("Graph payload carries branded HTML and matching inline PNG attachment without sending live mail", async () => {
  const previous = globalThis.fetch;
  const oldEnabled = process.env.OTP_EMAILS_ENABLED;
  const calls: { url: string; body?: string }[] = [];
  process.env.OTP_EMAILS_ENABLED = "true";
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push({
      url,
      body: typeof init?.body === "string" ? init.body : undefined,
    });
    return url.includes("login.microsoftonline.com")
      ? Response.json({ access_token: "test-token" })
      : new Response(null, { status: 202 });
  };
  try {
    await sendOTP("demo@example.com", "123456", "forget-password");
    assert.equal(calls.length, 2);
    const payload = JSON.parse(calls[1].body!);
    assert.equal(
      payload.message.toRecipients[0].emailAddress.address,
      "demo@example.com",
    );
    assert.ok(payload.message.subject.includes("password reset"));
    assert.ok(
      payload.message.body.content.includes("Reset your password securely"),
    );
    assert.ok(payload.message.body.content.includes("cid:anant-tattva-logo"));
    assert.equal(payload.message.attachments[0].contentId, "anant-tattva-logo");
    assert.equal(payload.message.attachments[0].isInline, true);
    assert.equal(payload.message.attachments[0].contentType, "image/png");
    assert.ok(
      Buffer.from(payload.message.attachments[0].contentBytes, "base64")
        .length > 100,
    );
    assert.equal(payload.saveToSentItems, true);
  } finally {
    globalThis.fetch = previous;
    if (oldEnabled === undefined) delete process.env.OTP_EMAILS_ENABLED;
    else process.env.OTP_EMAILS_ENABLED = oldEnabled;
  }
});
