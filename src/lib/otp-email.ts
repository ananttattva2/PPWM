export type OTPEmailPurpose =
  "sign-in" | "email-verification" | "forget-password" | "change-email";
export type OTPEmailOptions = {
  otp: string;
  purpose?: OTPEmailPurpose;
  email: string;
  supportEmail?: string;
  workspaceURL?: string;
};
function escapeHTML(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}
export function createOTPEmail({
  otp,
  purpose = "sign-in",
  email,
  supportEmail = "crm@ananttattva.com",
  workspaceURL,
}: OTPEmailOptions) {
  if (!/^\d{6}$/.test(otp))
    throw new Error("OTP must contain exactly six digits");
  const titles: Record<
    OTPEmailPurpose,
    { heading: string; intro: string; subject: string }
  > = {
    "sign-in": {
      heading: "Your secure sign-in code",
      intro:
        "A little clarity. A secure start. Use the code below to sign in to your packaging workspace.",
      subject: "Your ANANT TATTVA sign-in code",
    },
    "email-verification": {
      heading: "Verify your email address",
      intro:
        "Confirm your email address to keep your workspace secure. Enter the code below where you requested verification.",
      subject: "Verify your ANANT TATTVA email",
    },
    "forget-password": {
      heading: "Reset your password securely",
      intro:
        "Use the code below to confirm your password reset. Return to the password form where you requested this code.",
      subject: "Your ANANT TATTVA password reset code",
    },
    "change-email": {
      heading: "Confirm your new email",
      intro:
        "Use this code to confirm the new email address for your workspace account.",
      subject: "Confirm your ANANT TATTVA email change",
    },
  };
  const copy = titles[purpose];
  const recipient = escapeHTML(email);
  const support = escapeHTML(supportEmail);
  let actionURL = "";
  try {
    const url = new URL(workspaceURL || "");
    if (
      url.protocol === "https:" &&
      !["localhost", "127.0.0.1", "::1"].includes(url.hostname)
    ) {
      url.pathname =
        purpose === "forget-password" ? "/dashboard/profile" : "/login";
      url.search = "";
      url.hash = "";
      actionURL = escapeHTML(url.toString());
    }
  } catch {}
  const heading = escapeHTML(copy.heading),
    intro = escapeHTML(copy.intro);
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${heading}</title>
<style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}table{border-collapse:collapse}img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}@media screen and (max-width:620px){.email-shell{width:100%!important}.outer-pad{padding:24px 12px!important}.content-pad{padding-left:24px!important;padding-right:24px!important}.email-heading{font-size:25px!important;line-height:33px!important}.code-text{font-size:37px!important;letter-spacing:9px!important}.code-pad{padding:23px 15px!important}.footer-pad{padding-left:20px!important;padding-right:20px!important}}</style></head>
<body style="margin:0;padding:0;width:100%;background-color:#f3f5f8;font-family:Arial,Helvetica,sans-serif;color:#162b48;">
<div style="display:none;font-size:1px;line-height:1px;color:#f3f5f8;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${otp} is your verification code. It expires in 5 minutes. Never share this code.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f3f5f8"><tr><td class="outer-pad" align="center" style="padding:42px 20px;">
<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" class="email-shell" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
<tr><td align="center" style="padding:0 0 24px;"><img src="cid:anant-tattva-logo" width="176" height="56" alt="ANANT TATTVA" style="display:block;width:176px;height:56px;color:#ff7900;font-size:20px;font-weight:bold;"><p style="margin:10px 0 0;font-size:10px;line-height:16px;letter-spacing:1.5px;color:#8b96a5;">YOUR PACKAGING WORKSPACE</p></td></tr>
<tr><td bgcolor="#ffffff" style="background:#ffffff;border:1px solid #e5eaf0;border-radius:16px;overflow:hidden;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td height="4" bgcolor="#ff7900" style="height:4px;font-size:1px;line-height:4px;border-radius:16px 16px 0 0;">&nbsp;</td></tr>
<tr><td class="content-pad" align="center" style="padding:34px 44px 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" width="46" height="46" bgcolor="#fff1e6" style="width:46px;height:46px;border-radius:14px;color:#ef790e;font-size:23px;line-height:46px;">&#10003;</td></tr></table><p style="margin:20px 0 10px;font-size:10px;line-height:17px;letter-spacing:1.7px;font-weight:bold;color:#e8781f;">SECURE ACCOUNT ACCESS</p><h1 class="email-heading" style="margin:0;font-size:29px;line-height:38px;letter-spacing:-0.7px;font-weight:700;color:#172e4d;">${heading}</h1><p style="margin:13px 0 0;font-size:14px;line-height:23px;color:#7a8799;">${intro}</p></td></tr>
<tr><td class="content-pad" style="padding:26px 44px 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#fff9f3" style="background:#fff9f3;border:1px solid #f5dcc4;border-radius:12px;"><tr><td class="code-pad" align="center" style="padding:25px 24px 23px;"><p style="margin:0 0 12px;font-size:10px;line-height:16px;letter-spacing:1.6px;font-weight:bold;color:#ba8457;">YOUR VERIFICATION CODE</p><p class="code-text" style="margin:0;font-family:'Courier New',Courier,monospace;font-size:44px;line-height:54px;font-weight:bold;letter-spacing:12px;color:#162c49;white-space:nowrap;">${otp}</p><p style="margin:13px 0 0;font-size:12px;line-height:19px;color:#ac7b51;">Valid for <strong>5 minutes</strong> &nbsp;&middot;&nbsp; One-time use</p></td></tr></table></td></tr>
<tr><td class="content-pad" align="center" style="padding:20px 44px 0;"><p style="margin:0;font-size:12px;line-height:20px;color:#8390a1;">Requested for <span style="color:#52657e;">${recipient}</span></p><p style="margin:8px 0 0;font-size:13px;line-height:21px;color:#6f7f93;">Return to your browser and enter all six digits.</p>${actionURL ? `<p style="margin:20px 0 0;"><a href="${actionURL}" style="display:inline-block;padding:12px 22px;background:#ff7900;border:1px solid #ff7900;border-radius:7px;color:#ffffff;text-decoration:none;font-size:12px;line-height:19px;font-weight:bold;">Return to your workspace &rarr;</a></p>` : ""}</td></tr>
<tr><td class="content-pad" style="padding:25px 44px 30px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f8fb" style="background:#f5f8fb;border-radius:9px;"><tr><td style="padding:15px 17px;"><p style="margin:0 0 5px;font-size:12px;line-height:18px;font-weight:bold;color:#455b77;">A quick security reminder</p><p style="margin:0;font-size:11px;line-height:19px;color:#8390a3;">Never share this code with anyone. Our team will never ask for your verification code. If you didn&rsquo;t request this email, you can safely ignore it.</p></td></tr></table></td></tr>
<tr><td class="footer-pad" align="center" style="padding:18px 30px;background:#fbfcfe;border-top:1px solid #edf0f5;border-radius:0 0 16px 16px;"><p style="margin:0;font-size:11px;line-height:19px;color:#8c98a9;">Need a hand? <a href="mailto:${support}" style="color:#ce7c37;text-decoration:none;font-weight:bold;">${support}</a></p></td></tr></table></td></tr>
<tr><td align="center" style="padding:24px 20px 0;"><p style="margin:0;font-size:10px;line-height:18px;color:#95a1af;">ANANT TATTVA &nbsp;&middot;&nbsp; Connected data. Clearer decisions.</p><p style="margin:6px 0 0;font-size:10px;line-height:17px;color:#a8b1be;">This is an automated security email.</p></td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
  return { subject: `${otp} · ${copy.subject}`, html };
}
