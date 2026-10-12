# ANANT TATTVA · PPWM

Next.js App Router application for packaging sustainability teams. Includes an animated marketing site, six-digit Microsoft Graph email OTP sign-in, MongoDB-backed sessions and client onboarding, role-based user management, and profile photos.

## Run locally

Requires Node.js 22+ and a MongoDB Atlas database.

```sh
npm ci
cp .env.example .env.local
# Fill the environment values. Never commit .env.local.
npm run bootstrap-admin -- owner@company.com First Last
# Optional second administrator (admin role):
npm run bootstrap-admin -- admin@company.com First Last admin
npm run dev
```

Open http://localhost:3000. `/login`, `/admin/login` and `/super-admin/login` share verified email authentication. The account role determines access; selecting a portal never grants privileges. Public account registration is disabled.

On Windows, run `npm run local` to start the local server in the background. It checks port 3000 and waits for the homepage to respond before reporting success. The server stays running after the command finishes; logs are saved in the ignored `.local/` folder. Run this command again after restarting your computer.

If Chrome shows `ERR_CONNECTION_REFUSED`, the local server is not running. Start it with `npm run local`, then refresh http://localhost:3000. With `npm run dev`, keep its terminal open; closing the terminal stops the server. GitHub stores the source code and does not run a localhost server.

## Roles

| Role              | Access                                                                  |
| ----------------- | ----------------------------------------------------------------------- |
| Super admin       | Dashboard, client creation, all user roles, profile                     |
| Admin             | Dashboard, client creation, user/manager/compliance management, profile |
| Manager           | Dashboard, client creation, profile                                     |
| Compliance / User | Dashboard, client viewing, profile                                      |

Inactive accounts cannot create sessions or access protected routes. Changes to role/status revoke existing sessions. Administrators cannot change their own role or deactivate themselves.

## Structure

```text
src/app/                 Pages, layouts and server API routes
src/components/          Brand, landing page, authentication and providers
src/components/workspace/ Dashboard, client wizard, team and profile UI
src/components/ui/       shadcn/ui and Aceternity components
src/components/magicui/  Magic UI components
src/components/reactbits/ React Bits animation
src/lib/                 Database, auth, authorization, email and utilities
scripts/                 Explicit first-administrator provisioning
tests/                   Browser and authorization regression checks
```

UI uses Tailwind, shadcn/ui, Mantine form/stepper/progress components and HeroUI avatars/providers. Aceternity Spotlight, Magic UI Border Beam, React Bits SplitText, GSAP and Motion provide animation. Third-party source components retain their upstream licenses.

## Email and database setup

Microsoft Entra app needs Microsoft Graph **Mail.Send application permission with admin consent**, and access to the sender mailbox. Configure Atlas network access for the deployment's outbound IP. Keep all credentials server-side in environment variables.

The first administrator must be provisioned with an email you own. No account is created automatically from the sender address. The bootstrap command creates an inaccessible random initial password; email OTP proves ownership and the profile supports password reset.

## Validation and deployment

```sh
npm run typecheck
npm run build
npm test
npm start
```

Deploy to a Node.js-capable Next.js host. Set `BETTER_AUTH_URL` to the HTTPS site origin and configure every `.env.example` value through your host's secret settings. MongoDB's native driver requires Node.js; this application is not a static export or a Cloudflare Workers deployment.

Marketing charts are labelled illustrative. This release manages clients and team access; it does not implement regulatory calculations, EPR filing or certification. Demo/contact buttons open email requests. The brand uses local SVG assets recreated from the second supplied logo reference, including a light variant for the login panel. The original source image is not present locally; use it if exact pixel fidelity is required.

