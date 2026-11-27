# AGENTS.md

Guide for AI agents and humans working on the backend of this monorepo (pnpm workspaces).
Keep this file current: if you change a rule, a command or an architectural decision, update it in the same commit.

## Layout

| Path | Role |
|---|---|
| `packages/core` | Hexagonal core: domain, ports, use cases. **No framework imports.** |
| `packages/auth` | Driven adapter: Better Auth config and `IdentityProvider` implementation |
| `packages/db` | Driven adapter: Drizzle + Postgres (Neon), schema, migrations, `withTenant`, RLS helpers |
| `apps/api` | Driving adapters (HTTP routes, and MCP for third-party agents at `POST /mcp`, Nitro **v2** `nitropack`) and composition root (`server/utils/container.ts`) |
| `apps/web`, `packages/ui`, `packages/shared` | Frontend, UI layer, shared zod contract |

Dependency rule: `apps/* -> auth/db -> core`. `core` imports nothing from better-auth, drizzle, pg, nitropack or h3.
`pnpm check:boundaries` enforces it; do not weaken `scripts/check-boundaries.mjs` to make code pass.

## Commands

```bash
pnpm check            # boundaries + API contract + typecheck + lint (run before every commit)
pnpm lint             # backend: no detached promises (Lambda freezes after the response)
pnpm test             # unit tests: core, auth, db (pure), api (incl. MCP tools), scripts (check:api)
docker compose up -d  # Postgres (:5433) + Mailpit (SMTP :1025, inbox/API http://localhost:8025)
pnpm test:db          # RLS / tenant isolation against Postgres (docker compose up -d first)
pnpm e2e:auth         # sign-up -> Mailpit verification link -> session, sign-in/out, Google start (api + Postgres + Mailpit)
pnpm e2e:tenant       # tenant isolation over HTTP (api + Postgres + Mailpit running)
pnpm e2e:oauth        # OAuth authorize -> consent -> token -> /mcp on the API (api + Postgres + Mailpit running)
# e2e overrides when ports clash: API_BASE (must match NITRO_AUTH_BASE_URL), WEB_ORIGIN, MAILPIT, MCP_RESOURCE
APP_DB_PASSWORD=saas_app pnpm --filter @saas/db db:app-role   # runtime DB role (after db:migrate)
pnpm --filter @saas/db db:cleanup-dcr   # delete dynamically registered OAuth clients unused for 30 days (run periodically)
```

Git hooks (lefthook, `lefthook.yml`, installed by `pnpm install`): pre-commit runs `check:boundaries` and `check:api` on backend changes; commit-msg enforces Conventional Commits and rejects Co-Authored-By/AI attribution lines; pre-push runs `pnpm check` and `pnpm test`. Skip once with `LEFTHOOK=0` only if you must; never weaken the hooks to make a commit pass.

Email verification is required: sign-up gives no session until the emailed link is opened. Mail goes to Resend when `NITRO_RESEND_API_KEY` is set (production requires it and `NITRO_EMAIL_FROM`, or the API refuses to start); otherwise to SMTP `NITRO_SMTP_HOST:NITRO_SMTP_PORT` (Mailpit). Google sign-in is on only when `NITRO_GOOGLE_CLIENT_ID` and `NITRO_GOOGLE_CLIENT_SECRET` are both set; it never links to an unverified account (`requireLocalEmailVerified`, keep it).

Auth schema changes: `pnpm --filter @saas/auth auth:schema`, then `pnpm --filter @saas/db db:generate`.

## API contract (mandatory for every new endpoint)

Every endpoint in `apps/api/server/api` ships with **both**:

1. **OpenAPI docs**: a `defineRouteMeta({ openAPI: { tags, operationId, summary, description, responses, ... } })` in the handler file. Protected routes declare `security`, path params and every status they can return (401/403 included).
2. **An MCP tool** in `apps/api/server/mcp/tools/<name>.ts` exporting `export const route = 'METHOD /api/path/{param}'`, registered in `server/mcp/server.ts`. The route and the tool call the same function in `server/utils/endpoints.ts`. Mark read-only tools with `readOnlyHint`; destructive or credential-minting ones need explicit human confirmation.

`pnpm check:api` fails the build if either is missing (route files must be named `<name>.<get|post|put|patch|delete>.ts` so they can be checked), if an `operationId` repeats, or if a tool points at a route that does not exist.
The only escape hatch is `scripts/api-contract.exemptions.json`: an entry needs a real `reason`, and it fails once the route gets a tool (stale). Treat exemptions as debt, never as a default.

Nitro notes (we run `nitropack` 2.x; nitro.build docs describe v3):
- `defineRouteMeta` is auto-imported; `experimental.openAPI` is on. Spec at `/_openapi.json`, UIs at `/_scalar` and `/_swagger` (dev only; protect them before enabling `openAPI.production`).
- Keep schema literals simple (no `minLength`/`maxLength`/`minItems`): `apps/web` typechecks the API route types and rejects them. Put such limits in `description`.
- Route files must `import` their utils explicitly. Nitro auto-imports of `server/utils` break the typecheck of `apps/web`. Files under `server/mcp` (and anything a unit test imports) use relative imports with the `.ts` extension.
- Config reaches utils as `unknown` and is validated with zod (`parseConfig`); never log config values.

MCP delegation model: tools run **in-process** in `apps/api`. `POST /mcp` verifies the bearer token with `requireMcpAuth` (audience `NITRO_MCP_RESOURCE`, which must be `<API origin>/mcp`); the tool context builds an `agent` principal from the claims (`sub`, `tenant_id`) plus the user's **current** role (`mcpPrincipal` in `packages/auth`), then runs the endpoint function, which authorizes like the route. Never forward the received token to anything (token passthrough is forbidden by the MCP spec). Map denials with `guarded(...)` so every one reads the same `Forbidden`.
OAuth client registration: CIMD and pre-registered clients always; open dynamic registration (RFC 7591, no session) when `NITRO_OAUTH_DCR_ENABLED` is on (default: on outside production, off in production). On top of Better Auth's checks, `registrationProblem` (`packages/auth/src/adapters/client-registration.ts`) rejects unknown metadata, opting out of PKCE, names over 100 chars, more than 5 redirect URIs, redirect URIs other than https or http loopback, wildcards and non-https display URLs. Registration is limited to 10 per IP per hour; Better Auth's limiter runs in every environment with counters in Postgres (`rate_limit`), and only the sign-in / sign-up / email limits are relaxed outside production. OAuth discovery (`/.well-known/*`), `oauth2/register`, `oauth2/token`, `oauth2/revoke` and `jwks` allow CORS from any origin without credentials (browser clients such as MCP Inspector); every other route only allows the web origin. `/consent` marks every client except CIMD as "No verificado". Clean up unused registrations with `pnpm --filter @saas/db db:cleanup-dcr` (30 days, never consented). Before turning DCR on in production, set `advanced.ipAddress` to a header the edge sets: `x-forwarded-for` can be spoofed by the client.

## Multi-tenancy (`tenantId` = Better Auth organization id)

- Every business table has `tenant_id text not null` and RLS enabled with `tenantRlsSql('<table>')` in its migration. `pnpm test:db` fails on a business table without both.
- `tenantRlsSql` is idempotent. If its policy SQL ever changes, add a migration that re-runs it for every business table; `pnpm test:db` fails on a table whose deployed policy is older than the helper.
- Touch tenant data only through `withTenant(db, tenantId, tx => ...)`. Never query business tables with the bare `db`.
- RLS is ignored by superusers, `BYPASSRLS` roles and (without FORCE) the owner. The app connects as `saas_app` (`NITRO_DATABASE_URL`); migrations use the owner (`DATABASE_URL`). Never run the app as the owner. On Neon the console owner role bypasses RLS.
- Policies use `NULLIF(current_setting('app.tenant_id', true), '')`: after a tenant transaction, Postgres returns `''` (not NULL) on that connection. Do not simplify it.
- Authorization: `authorizeAction(principal, action, tenantId)` from core on every tenant route and tool (`requireAccess` in `apps/api/server/utils/principal.ts`, or inside the shared endpoint function in `server/utils/endpoints.ts` when an MCP tool exposes it). Wrong tenant and missing permission return the same 403, so tenants are never revealed.
- API keys belong to an organization and carry explicit scopes. Better Auth rejects client-set `permissions`; keys are created server-side (`POST /api/tenants/{tenantId}/api-keys`), and nobody can grant a scope they do not hold. Keys can never hold `apikeys:manage`.
- MCP access tokens carry `tenant_id`: the consent is tied to the session's active organization (`postLogin.consentReferenceId`) and the claim is only emitted if the user is a member when the token is issued or refreshed. It is not proof of current membership: anything that uses `tenant_id` must still authorize against current membership (`mcpPrincipal` re-reads the role on every call, then `authorizeAction`). There is no tenant picker yet: a user in several tenants authorizes the active one.
- Requests are logged as JSON with `tenantId` (including denied ones). Log the pathname only, never query strings or config.

## Platform staff and 2FA

Roles `superadmin`, `soporte`, `finanzas` live in core (`domain/platform.ts`). 2FA is mandatory: `resolvePlatformAccess` only grants a platform role when `twoFactorEnabled` is true; otherwise the principal gets `twoFactorRequired`. Soporte must never see full payment data: payment endpoints decide masking with `paymentVisibility(principal)`.
Status: the core rules exist and are tested. Wiring (Better Auth `twoFactor` plugin, admin roles, blocking `/admin/*` without 2FA, platform routes) is in progress (issue #17).

## Testing and conventions

- Lambda (`aws_lambda` preset) freezes the process once the response is sent: await every side effect (email, HTTP calls) before returning. `pnpm lint` rejects floating promises, `void promise` and async functions without `await`; do not disable those rules to make code pass.
- Write the failing test first and watch it fail for the right reason. Isolation bugs are easy to write and hard to see: add a regression test with every fix.
- Unit tests use `node --test` with `.ts` files (relative imports keep the `.ts` extension).
- Generated artifacts (code, comments, UI copy, docs) are in English. Conventional Commits.
- Work in small commits that keep tests and docs with the behavior. Do not push or open PRs without being asked.
- GitHub issues are the task list; comment progress on the issue, close it only when its criteria are met and the work is merged.
