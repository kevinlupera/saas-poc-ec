# AGENTS.md

Guide for AI agents and humans working on the backend of this monorepo (pnpm workspaces).
Keep this file current: if you change a rule, a command or an architectural decision, update it in the same commit.

## Layout

| Path | Role |
|---|---|
| `packages/core` | Hexagonal core: domain, ports, use cases. **No framework imports.** |
| `packages/auth` | Driven adapter: Better Auth config and `IdentityProvider` implementation |
| `packages/db` | Driven adapter: Drizzle + Postgres (Neon), schema, migrations, `withTenant`, RLS helpers |
| `apps/api` | Driving adapter (HTTP, Nitro **v2** `nitropack`) and composition root (`server/utils/container.ts`) |
| `apps/mcp` | Driving adapter (MCP) for third-party agents, protected by OAuth tokens issued by `apps/api` |
| `apps/web`, `packages/ui`, `packages/shared` | Frontend, UI layer, shared zod contract |

Dependency rule: `apps/* -> auth/db -> core`. `core` imports nothing from better-auth, drizzle, pg, nitropack or h3.
`pnpm check:boundaries` enforces it; do not weaken `scripts/check-boundaries.mjs` to make code pass.

## Commands

```bash
pnpm check            # boundaries + API contract + typecheck (run before every commit)
pnpm test             # unit tests: core, auth, db (pure), api, mcp
pnpm test:db          # RLS / tenant isolation against Postgres (docker compose up -d first)
pnpm e2e:tenant       # tenant isolation over HTTP (api + Postgres running)
pnpm e2e:oauth        # OAuth authorize -> consent -> token -> /mcp (api + mcp + Postgres running)
APP_DB_PASSWORD=saas_app pnpm --filter @saas/db db:app-role   # runtime DB role (after db:migrate)
```

Auth schema changes: `pnpm --filter @saas/auth auth:schema`, then `pnpm --filter @saas/db db:generate`.

## API contract (mandatory for every new endpoint)

Every endpoint in `apps/api/server/api` ships with **both**:

1. **OpenAPI docs**: a `defineRouteMeta({ openAPI: { tags, operationId, summary, description, responses, ... } })` in the handler file. Protected routes declare `security`, path params and every status they can return (401/403 included).
2. **An MCP tool** in `apps/mcp/server/tools/<name>.ts` exporting `export const route = 'METHOD /api/path/{param}'` and registering the tool. Mark read-only tools with `readOnlyHint`; destructive or credential-minting ones need explicit human confirmation.

`pnpm check:api` fails the build if either is missing, if an `operationId` repeats, or if a tool points at a route that does not exist.
The only escape hatch is `scripts/api-contract.exemptions.json`: an entry needs a real `reason`, and it fails once the route gets a tool (stale). Treat exemptions as debt, never as a default.

Nitro notes (we run `nitropack` 2.x; nitro.build docs describe v3):
- `defineRouteMeta` is auto-imported; `experimental.openAPI` is on. Spec at `/_openapi.json`, UIs at `/_scalar` and `/_swagger` (dev only; protect them before enabling `openAPI.production`).
- Keep schema literals simple (no `minLength`/`maxLength`/`minItems`): `apps/mcp` and `apps/web` typecheck the API route types and reject them. Put such limits in `description`.
- Route files must `import` their utils explicitly. Nitro auto-imports of `server/utils` break the typecheck of `apps/mcp`/`apps/web`.
- Config reaches utils as `unknown` and is validated with zod (`parseConfig`); never log config values.

Open decision: **how tools call the API on behalf of the user.** Forwarding the agent's token to the API is *token passthrough*, which the MCP spec forbids. Until a delegation model is chosen, tools for authenticated endpoints are exempt. Do not ship a tool that forwards the received token.

## Multi-tenancy (`tenantId` = Better Auth organization id)

- Every business table has `tenant_id text not null` and RLS enabled with `tenantRlsSql('<table>')` in its migration. `pnpm test:db` fails on a business table without both.
- Touch tenant data only through `withTenant(db, tenantId, tx => ...)`. Never query business tables with the bare `db`.
- RLS is ignored by superusers, `BYPASSRLS` roles and (without FORCE) the owner. The app connects as `saas_app` (`NITRO_DATABASE_URL`); migrations use the owner (`DATABASE_URL`). Never run the app as the owner. On Neon the console owner role bypasses RLS.
- Policies use `NULLIF(current_setting('app.tenant_id', true), '')`: after a tenant transaction, Postgres returns `''` (not NULL) on that connection. Do not simplify it.
- Authorization: `authorizeAction(principal, action, tenantId)` from core on every tenant route (`requireAccess` in `apps/api/server/utils/principal.ts`). Wrong tenant and missing permission return the same 403, so tenants are never revealed.
- API keys belong to an organization and carry explicit scopes. Better Auth rejects client-set `permissions`; keys are created server-side (`POST /api/tenants/{tenantId}/api-keys`), and nobody can grant a scope they do not hold. Keys can never hold `apikeys:manage`.
- Requests are logged as JSON with `tenantId` (including denied ones). Log the pathname only, never query strings or config.

## Platform staff and 2FA

Roles `superadmin`, `soporte`, `finanzas` live in core (`domain/platform.ts`). 2FA is mandatory: `resolvePlatformAccess` only grants a platform role when `twoFactorEnabled` is true; otherwise the principal gets `twoFactorRequired`. Soporte must never see full payment data: payment endpoints decide masking with `paymentVisibility(principal)`.
Status: the core rules exist and are tested. Wiring (Better Auth `twoFactor` plugin, admin roles, blocking `/admin/*` without 2FA, platform routes) is in progress (issue #17).

## Testing and conventions

- Write the failing test first and watch it fail for the right reason. Isolation bugs are easy to write and hard to see: add a regression test with every fix.
- Unit tests use `node --test` with `.ts` files (relative imports keep the `.ts` extension).
- Generated artifacts (code, comments, UI copy, docs) are in English. Conventional Commits.
- Work in small commits that keep tests and docs with the behavior. Do not push or open PRs without being asked.
- GitHub issues are the task list; comment progress on the issue, close it only when its criteria are met and the work is merged.
