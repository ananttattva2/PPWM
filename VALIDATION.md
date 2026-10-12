# Verification

Verified locally on 12 October 2026.

Packaging import verification covers actual CSV/XLSX parsing, quoted CSV fields, explicit mapping, category overrides, missing required values, invalid materials/numbers, duplicate SKU detection and rejection of oversized XLSX archives before parsing. Browser tests cover the three-step flow, incomplete-data gating, editable mapping/reprocessing, persisted import settings and original bytes, transactional linkage to the client, three persisted SKU records and authenticated source download. Screenshots: `artifacts/packaging-import-*.png` and `artifacts/client-review.png`. Five browser tests and five parser tests pass. Parser dependencies were audited after applying a compatible patched UUID override.

The redesigned OTP email has desktop/mobile browser previews in `artifacts/otp-email-*.png`. Template tests cover purposes, escaping, invalid code rejection, safe workspace links, and embedded logo data. A mocked transport test checks Microsoft Graph HTML and inline-attachment payloads without sending email. Real Outlook inbox rendering of this redesign has not been independently verified.

The packaging compliance section now follows the supplied reference composition: prominent headline, material/regulation cards, PPWM centre panel, coloured connectors, packaging illustration and numbered process cards. Desktop, mobile and dark-mode screenshots are in `artifacts/packaging-compliance-*.png`. Five browser tests pass, including asset loading and responsive section checks. The original illustration is recreated with a newly generated transparent asset; source prompt and provenance are in `public/images/ASSETS.md`.

- Next.js production build and TypeScript checks pass.
- Five Playwright tests pass: desktop/mobile landing and navigation, all login portals, the reference compliance section, anonymous access rejection, and authenticated database-backed workflows.
- Authenticated test covers rejected invalid OTP, accepted six-digit OTP, dashboard, client wizard persistence, team-member creation, profile persistence, role restriction, and inactive-account denial. Uses a temporary hashed OTP fixture rather than reading a real inbox. Test records are removed afterward.
- MongoDB Atlas connectivity verified. This local network requires the optional `MONGODB_DNS_SERVERS` fallback.
- Microsoft Graph credentials and Mail.Send application permission verified. A real OTP request for the configured super-admin returned HTTP 200; inbox receipt has not been independently checked.
- `npm audit` reports zero known vulnerabilities across installed dependencies.
- `.env.local` is ignored and excluded from commits.
- Updated onboarding verifies legal/trade names, GST number, registration reference, all eight organisation role options, registered address, email, telephone and authorised person. Tests cover required-field toasts, document upload, exact MongoDB byte persistence, authenticated download, blocked anonymous download, rejection of a mismatched file signature, and document bytes excluded from client list responses. Desktop/mobile onboarding screenshots are included.
- Compact workspace update verifies a two-column desktop onboarding layout, reduced page height, working navbar client search, mobile navigation opening/Escape dismissal, no horizontal overflow and no uncaught browser errors. The development indicator is disabled; body-only hydration handling accommodates attributes inserted by browser extensions.
- Floating controls retain label/error accessibility for text, multiline, select and password fields. Browser tests verify focused/filled states, a 72 px icon-only sidebar, expansion to 216 px, collapsed-state persistence after reload, dark/light switching and persistence in a new tab. Screenshots include dark mode with expanded and collapsed navigation. Theme and sidebar preferences are stored locally; reduced-motion preferences are respected.

Screenshots in `artifacts/` are QA captures; any displayed QA account/client is temporary test data. The logo uses local SVG assets recreated from the second supplied reference; the former Om text mark has been removed.

No live hosting deployment was requested or created. Run `npm run dev` for local access; Node.js deployment instructions are in README.md.
