import "server-only";
export async function sendOTP(email: string, otp: string) {
  if (process.env.OTP_EMAILS_ENABLED !== "true")
    throw new Error("OTP email delivery is disabled");
  const params = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID!,
    client_secret: process.env.MS_CLIENT_SECRET!,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`,
    { method: "POST", body: params, signal: AbortSignal.timeout(15000) },
  );
  if (!tokenResponse.ok)
    throw new Error("Microsoft Graph authentication failed");
  const token = await tokenResponse.json();
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(process.env.OTP_SENDER_EMAIL!)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: `${otp} is your ANANT TATTVA verification code`,
          body: {
            contentType: "HTML",
            content: `<div style="font-family:Arial;padding:40px;color:#172033"><h2 style="color:#ff6b00">ANANT TATTVA</h2><h1>Your secure sign-in code</h1><p>Use this code within 5 minutes:</p><div style="font-size:36px;letter-spacing:10px">${otp}</div><p>If you did not request this, ignore this email.</p></div>`,
          },
          toRecipients: [{ emailAddress: { address: email } }],
          replyTo: [
            {
              emailAddress: {
                address:
                  process.env.MAIL_REPLY_TO || process.env.OTP_SENDER_EMAIL,
              },
            },
          ],
        },
        saveToSentItems: true,
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok)
    throw new Error("Microsoft Graph could not send the verification email");
}
