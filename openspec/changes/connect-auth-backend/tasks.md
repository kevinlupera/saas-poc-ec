# Tasks

## 1. Mailpit infrastructure

- [x] 1.1 Add the `mailpit` service (`axllent/mailpit`, pinned tag, ports `1025:1025` and `8025:8025`) to `docker-compose.yml`. Verify: `docker compose up -d` then `curl -s localhost:8025/api/v1/messages` returns JSON

## 2. Email delivery and configuration

- [x] 2.1 Write failing tests in `apps/api/test/` for `parseConfig`: production without `resendApiKey` or `emailFrom` fails naming the keys and not their values; non-production without Resend picks SMTP with `localhost:1025` defaults; `resendApiKey` without `emailFrom` fails; Google ID/secret only-one fails, both or neither passes. Verify: `pnpm --filter @saas/api test` fails for the right reason
- [x] 2.2 Write failing tests in `packages/auth/test/` for `resendSender` (stubbed `fetch`: POST to `https://api.resend.com/emails` with bearer key, `from`/`to`/`subject`; throws on non-2xx without echoing the key). Verify: `pnpm --filter @saas/auth test` fails for the right reason
- [x] 2.3 Add `packages/auth/src/adapters/email.ts` with `resendSender` (fetch) and `smtpSender` (`nodemailer`, no TLS/auth); add `nodemailer` to `@saas/auth`. Verify: tests from 2.2 pass, `pnpm check:boundaries` passes
- [x] 2.4 Add `resendApiKey`, `emailFrom`, `smtpHost`, `smtpPort`, `googleClientId`, `googleClientSecret` to `apps/api/nitro.config.ts` runtimeConfig and the rules + adapter selection to `container.ts` (production from `NODE_ENV`). Verify: tests from 2.1 pass
- [x] 2.5 Document `NITRO_RESEND_API_KEY`, `NITRO_EMAIL_FROM`, `NITRO_SMTP_HOST`, `NITRO_SMTP_PORT`, `NITRO_GOOGLE_CLIENT_ID`, `NITRO_GOOGLE_CLIENT_SECRET` in `apps/api/.env.example` (server only, which are required in production, Mailpit defaults). Verify: `grep -rE "RESEND|GOOGLE|SMTP" apps/web --include=*.ts --include=*.vue` finds no config

## 3. Better Auth: verification, Google, linking

- [x] 3.1 In `packages/auth/src/auth.ts` add `sendEmail` and optional `google` to `AuthConfig`; set `requireEmailVerification: true`, `emailVerification` (`sendOnSignUp`, `sendOnSignIn`, `autoSignInAfterVerification`, un-awaited `sendVerificationEmail` that logs failures without URL/token, Spanish copy), `socialProviders` from `google`, and `account.accountLinking.requireLocalEmailVerified: true`; wire both from `container.ts`. Verify: `pnpm check` passes; with `pnpm dev:api`, a manual sign-up shows one email in Mailpit at `localhost:8025`
- [x] 3.2 Add `scripts/lib-auth.sh` with `verified_signup` (sign-up, poll Mailpit `/api/v1/search`, extract `/api/auth/verify-email?token=...`, open it, return the session cookie) and switch `scripts/e2e-tenant.sh` and `scripts/e2e-oauth.sh` to it. Verify: `pnpm e2e:tenant` and `pnpm e2e:oauth` pass
- [x] 3.3 Add `scripts/e2e-auth.sh` and root `"e2e:auth"` script asserting: sign-up sets no cookie and sends one email; duplicate email gets the same response; short password rejected with no email; sign-in before verifying → `EMAIL_NOT_VERIFIED` and a second email; opening the link sets a session with `emailVerified: true`; tampered token → error redirect, no session; wrong password vs unknown email identical; sign-out empties get-session; foreign `callbackURL` rejected; `sign-in/social` google → 4xx without Google vars, or an `accounts.google.com` URL with `redirect_uri=$NITRO_AUTH_BASE_URL/api/auth/callback/google` with them. Verify: `pnpm e2e:auth` passes in both Google modes
- [x] 3.4 Add `pnpm e2e:auth` and the Mailpit prerequisite (`docker compose up -d` now starts Postgres + Mailpit) to the Commands block of `AGENTS.md`. Verify: commands run as written

## 4. Docs

- [x] 4.1 Update `apps/web/README.md`: remove the "pending backend" / "API responde 404" notes; describe the real setup (API env vars, Mailpit UI at `http://localhost:8025`, Resend required in production, Google Cloud redirect URI `http://localhost:3001/api/auth/callback/google`, web callbacks `/verificar-email`, `/auth/complete`, `/login?error=oauth`), the linking rule (Google links only after the email is verified), that dev users created before this change must verify, and a manual checklist for real Google and Resend. Verify: following it from a clean checkout reaches `/auth/complete` via email verification and via Google
- [x] 4.2 Correct the Purpose of `openspec/specs/identity/user-auth/spec.md` so it no longer says the backend is not implemented. Verify: `openspec validate --specs --strict` passes

## 5. Integration check

- [x] 5.1 Run `pnpm check`, `pnpm test`, `pnpm e2e:auth`, `pnpm e2e:tenant`, `pnpm e2e:oauth`, then in a browser (`pnpm dev:api` + `pnpm dev:web`): register → `/verificar-email` → open link from Mailpit → signed in; sign out, sign in; Google sign-in with a new email; Google with the email of the verified password account → same account, no `/login?error=oauth`; Google cancel → `/login?error=oauth`. Verify: all pass; record results in the README verification section
- [x] 5.2 Run `openspec validate connect-auth-backend --strict`. Verify: passes

## Workflow follow-up

- Archive the change after review and merge.
