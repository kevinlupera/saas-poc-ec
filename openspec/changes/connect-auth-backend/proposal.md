# Proposal

## Why

The web login and registration screens (`apps/web`, archived change `frontend-auth`) already call the official Better Auth client against `/api/auth`, and `apps/api` already mounts Better Auth with email/password. But Google is not enabled on the server, emails are never verified (so Google cannot safely be linked to a password account), no email is ever sent, nothing proves the browser flow works end to end against the real API, and the web README still says the API is not integrated.

## What Changes

- **Email verification required.** Better Auth `emailAndPassword.requireEmailVerification: true`, `emailVerification.sendVerificationEmail`, sent on sign-up and on sign-in of an unverified account, auto sign-in after the link is opened. **BREAKING** for API clients: sign-up no longer returns a session cookie, and unverified accounts cannot sign in (`EMAIL_NOT_VERIFIED`). The web already handles both (`/verificar-email`).
- **Email delivery per environment.** Resend (HTTP API) when `NITRO_RESEND_API_KEY` is set; otherwise, outside production, SMTP to Mailpit (`NITRO_SMTP_HOST`/`NITRO_SMTP_PORT`, default `localhost:1025`, no TLS/auth). In production, a missing `NITRO_RESEND_API_KEY` or `NITRO_EMAIL_FROM` fails startup.
- **Mailpit in Docker.** `mailpit` service (`axllent/mailpit`) in `docker-compose.yml`, ports `1025` (SMTP) and `8025` (UI + REST API).
- **Google sign-in.** Google as a Better Auth social provider from server-only config (`NITRO_GOOGLE_CLIENT_ID`, `NITRO_GOOGLE_CLIENT_SECRET`, both or neither; disabled when absent).
- **Account linking rule kept explicit.** A Google identity is never linked to an account whose email is unverified; once the email is verified (via Mailpit or Resend), signing in with Google with the same email links to that account and no longer lands on `/login?error=oauth`.
- **`pnpm e2e:auth`.** HTTP check from the web origin against API + Postgres + Mailpit: sign-up without session, verification link read from the Mailpit API, session active after opening it, sign-in, sign-out and Google start. Existing `e2e:tenant` and `e2e:oauth` move to the same verify-then-session setup.
- **Docs.** `apps/web/README.md`, `apps/api/.env.example`, `AGENTS.md`.

Out of scope: password-reset emails (the web recovery screens stay unconnected), tenant creation after sign-up, cross-site cookie setup for production domains, MCP tools for `/api/auth/*` (Better Auth routes, not `server/api` handlers).

## Capabilities

### New Capabilities
- `identity/auth-api`: server-side identity behavior the web relies on — email/password sign-up with required email verification, sign-in, Google sign-in and account linking, cookie sessions, trusted origins and callbacks, verification email delivery, and server-only secrets.

### Modified Capabilities
None. `identity/user-auth` (frontend flows) already covers registration without session, the verification screen and `EMAIL_NOT_VERIFIED`; only its stale "no backend" Purpose wording is corrected.

## Impact

- `packages/auth/src/auth.ts` (`AuthConfig`, `createAuth`): Google, email verification, explicit account linking, a `sendEmail` function in config.
- New email adapters (Resend over `fetch`, SMTP to Mailpit) in `packages/auth`; new dependency `nodemailer` for SMTP.
- `apps/api/server/utils/container.ts` (`ConfigSchema`, adapter selection), `apps/api/nitro.config.ts`, `apps/api/.env.example`.
- `docker-compose.yml` (Mailpit), new `scripts/e2e-auth.sh`, shared Mailpit helper, updates to `scripts/e2e-tenant.sh` and `scripts/e2e-oauth.sh`.
- Docs: `apps/web/README.md`, `AGENTS.md`, `openspec/specs/identity/user-auth/spec.md` Purpose.
- External: a Google Cloud OAuth client (redirect URI `http://localhost:3001/api/auth/callback/google` plus production), a Resend account with a verified sending domain for production.
- No DB migration: `account` and `verification` tables already exist in the Better Auth schema.
