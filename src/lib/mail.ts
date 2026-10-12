import "server-only";
import { createOTPEmail, type OTPEmailPurpose } from "./otp-email";
import { emailLogoBase64 } from "./email-logo";
export async function sendOTP(
  email: string,
  otp: string,
  purpose: OTPEmailPurpose = "sign-in",
) {
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
  const template = createOTPEmail({
    email,
    otp,
    purpose,
    supportEmail: process.env.MAIL_REPLY_TO || process.env.OTP_SENDER_EMAIL,
    workspaceURL: process.env.BETTER_AUTH_URL,
  });
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
          subject: template.subject,
          body: {
            contentType: "HTML",
            content: template.html,
          },
          toRecipients: [{ emailAddress: { address: email } }],
          attachments: [
            {
              "@odata.type": "#microsoft.graph.fileAttachment",
              name: "anant-tattva.png",
              contentType: "image/png",
              contentId: "anant-tattva-logo",
              isInline: true,
              contentBytes: emailLogoBase64,
            },
          ],
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
