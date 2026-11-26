# Design

## Context

See proposal.md - Why. Observed state:

- `apps/web` creates its Better Auth client in `plugins/auth.client.ts` (`baseURL` = `NUXT_PUBLIC_API_BASE`, `basePath: /api/auth`, `credentials: 'include'`). `Credentials.client.vue` signs up with `callbackURL: <web>/verificar-email`, then calls `getSession` and goes to `/verificar-email` when there is no session; on `EMAIL_NOT_VERIFIED` it links to `/verificar-email`. `EmailRequest.client.vue` resends with `sendVerificationEmail`. Google uses `callbackURL: <web>/auth/complete`, `errorCallbackURL: <web>/login?error=oauth`. No web code change is needed.
- `apps/api/server/routes/api/auth/[...all].ts` forwards every request to `auth.handler`. `middleware/cors.ts` allows only `webOrigin` with credentials. `container.ts` validates config with zod (`parseConfig`, key names only in errors) and passes `trustedOrigins: [webOrigin]`.
- `packages/auth/src/auth.ts`: `emailAndPassword: { enabled: true }`, no `socialProviders`, no email sending.
- Better Auth 1.7.26 (read in `node_modules`): with `requireEmailVerification`, sign-up returns a generic response for duplicate emails and no session; `sendOnSignUp` defaults to `requireEmailVerification`; `verify-email` with `autoSignInAfterVerification` creates the session; linking refuses unverified local accounts by default (`requireLocalEmailVerified ?? true`) and, once local and provider emails are both verified, links implicitly.
- `scripts/e2e-tenant.sh` and `scripts/e2e-oauth.sh` take the session cookie straight from the sign-up response, which stops working once verification is required.
- `docker-compose.yml` has only `postgres` (5433).

## Goals / Non-Goals

**Goals:**
- Register → verify → signed in, and Google, working locally with no external account except Google; Resend only needed in production.
- One repeatable HTTP check (`pnpm e2e:auth`) of that contract against real API + Postgres + Mailpit.

**Non-Goals:**
- Changes to `apps/web` screens or the `identity/user-auth` requirements.
- Password-reset email (`sendResetPassword`), email templates beyond a plain verification message, production cookie domains, rate-limit storage (Better Auth's limiter is in-memory per Lambda container).

## Decisions

1. **Better Auth config.** `emailAndPassword: { enabled: true, requireEmailVerification: true }`; `emailVerification: { sendOnSignUp: true, sendOnSignIn: true, autoSignInAfterVerification: true, sendVerificationEmail }`; `account: { accountLinking: { requireLocalEmailVerified: true } }` (library default pinned so an upgrade cannot flip it); `socialProviders: config.google ? { google: config.google } : {}`. `sendVerificationEmail` calls `config.sendEmail({ to, subject, text, html })` without awaiting it (Better Auth's recommendation against timing-based enumeration) and catches the rejection, logging only an error kind, never the URL or token. Copy is in Spanish, like the web UI.
2. **Mail as a plain function, two adapters.** `AuthConfig.sendEmail: (msg) => Promise<void>`. Adapters in `packages/auth/src/adapters/email.ts`: `resendSender({ apiKey, from })` does one `fetch` POST to `https://api.resend.com/emails` and throws on non-2xx (no Resend SDK: one request does not justify a dependency); `smtpSender({ host, port, from })` uses `nodemailer` with `secure: false`, no auth (hand-rolling SMTP is not worth it). No core port: email is only used by the auth adapter today; promote it to `packages/core` when a business use case sends mail.
3. **Selection and fail-fast in the composition root.** `ConfigSchema` gains `resendApiKey`, `emailFrom`, `smtpHost` (default `localhost`), `smtpPort` (default `1025`), `googleClientId`, `googleClientSecret` (all `''` by default in `nitro.config.ts`, overridden by `NITRO_*`). Production = `process.env.NODE_ENV === 'production'` (set by the Nitro build/Lambda, `development` under `nitropack dev`), passed into `parseConfig` so tests can set it. Rules, refined in zod so errors list key names only: production requires `resendApiKey` and `emailFrom`; `resendApiKey` set requires `emailFrom` in any environment; Google keys both or neither. Selection: `resendApiKey` → Resend; else (non-production only) → SMTP. `emailFrom` defaults to `no-reply@localhost` only for SMTP. Alternative rejected: a separate `NITRO_EMAIL_PROVIDER` switch — the key's presence already says it, and an extra switch can disagree with it.
4. **Mailpit in compose.** `mailpit: image: axllent/mailpit, ports: ['1025:1025', '8025:8025']`, no volume (mail is disposable). Pin a concrete tag at apply time rather than `latest`.
5. **E2E via the Mailpit API.** New `scripts/lib-auth.sh` (sourced) with `verified_signup <email>`: sign-up with `Origin: $NITRO_WEB_ORIGIN`, poll `GET http://localhost:8025/api/v1/search?query=to:<email>` (built on `/api/v1/messages`), read the message, extract the `/api/auth/verify-email?token=...` link, open it with a cookie jar, return the session cookie. Unique emails per run avoid cross-run matches. `e2e-auth.sh` asserts the spec scenarios (no cookie on sign-up, `EMAIL_NOT_VERIFIED` + resend before verifying, session + `emailVerified: true` after, tampered token, identical wrong-password/unknown-email errors, sign-out, foreign callback, Google start or 4xx). `e2e-tenant.sh` and `e2e-oauth.sh` switch to `verified_signup`. Unit tests (`apps/api/test`) cover `parseConfig` rules and adapter selection; `packages/auth/test` covers `resendSender` request shape and error on non-2xx with a stubbed `fetch`.
6. **No MCP tool / OpenAPI meta.** `/api/auth/*` is a Nitro `routes/` catch-all owned by Better Auth, not a `server/api` handler, so `check:api` does not apply; Better Auth's `openAPI()` plugin documents it.

## Risks / Trade-offs

- [Existing unverified users in dev DBs can no longer sign in] → they get `EMAIL_NOT_VERIFIED` and a fresh email in Mailpit; documented in the README. No production users exist yet.
- [Fire-and-forget sending hides failures from the user] → the web already offers resend on `/verificar-email`; failures are logged (without token) for operators.
- [Lambda may freeze before an un-awaited send completes] → acceptable for SMTP in dev; for production verify delivery in the launch checklist, and switch to awaiting (accepting the timing signal) if emails go missing.
- [`NODE_ENV` misdetection] e.g. running the built server locally → it then demands Resend; documented, and the error names the keys.
- [Real Google and Resend not automated] → manual checklist in `apps/web/README.md`.
- [Users without a tenant] sessions get `activeOrganizationId = null`; tenant routes already return 403 → onboarding is a separate change.

## Migration Plan

1. Deploy with Resend key + sender configured (startup fails otherwise, which is the intended guard) and Google vars set or unset.
2. API clients relying on a sign-up session cookie must verify first (only our e2e scripts today, updated here).
3. Rollback: revert the commit; no schema change.
