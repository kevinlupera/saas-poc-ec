# saas-poc-ec

pnpm monorepo: web (Nuxt), API (Nitro) and MCP server (Nitro), deployed separately with automatic types between them.

```
apps/
  api/       Nitro → REST API.                                          :3001
  web/       Nuxt  → UI. API client.                                    :3000
  mcp/       Nitro → MCP server (POST /mcp).                            :3002
packages/
  shared/    TypeScript + zod. Shared contract (api, web, mcp). No frameworks.
  ui/        Nuxt layer: components, composables and theme. Nuxt apps only.
```

## Rules

1. **Business logic is never duplicated.** `web` consumes the API over HTTP. How `mcp` accesses data is **still undecided** (see below).
2. **`packages/shared` imports nothing from Vue, Nuxt or Nitro.** Only types, zod schemas and pure functions.
3. **`packages/ui` is for Nuxt apps only.** It may import `shared`; `shared` never imports `ui`.
4. **Don't pass generics to API calls** (`useApi<T>(...)`): they override automatic inference.
5. **`apps/web` never depends on `core`, `db` or `drizzle-orm`**: the browser never touches the database.

Rules 2, 3 and 5 are enforced by `pnpm check:boundaries` (also run by `pnpm check`): it checks each package's declared dependencies and rejects relative imports that leave the package folder. The rules live in `scripts/check-boundaries.mjs`.

## Requirements and commands

```bash
nvm install          # Node per .nvmrc
pnpm install
pnpm dev             # api + web + mcp in parallel
pnpm dev:api         # or just one: dev:api | dev:web | dev:mcp
pnpm mcp:inspect     # MCP Inspector UI → Streamable HTTP, http://localhost:3002/mcp (OAuth via apps/api)
docker compose up -d # Postgres on :5433
pnpm --filter @saas/db db:migrate
pnpm --filter @saas/db db:app-role   # runtime DB role without BYPASSRLS (idempotent)
pnpm test:db                         # RLS / tenant isolation tests against Postgres
pnpm test            # core, auth, api and mcp tests
pnpm e2e:tenant      # tenant isolation smoke test (api + Postgres running)
pnpm e2e:oauth       # OAuth + MCP smoke test (api, mcp + Postgres running)
pnpm typecheck       # all three apps
pnpm check           # check:boundaries + typecheck (use in CI)
pnpm build
```

## Automatic types

Nitro generates the API route types in `apps/api/.nitro/types/nitro-routes.d.ts` (when running `dev` or `prepare`).
`apps/web` (via `nuxt.config.ts`) and `apps/mcp` (via `tsconfig.json`) include that file, so each endpoint's **response** is inferred automatically:

```ts
// web
const { data } = await useApi('/api/health')          // useFetch → API
const r = await useNuxtApp().$api('/api/appointments', { method: 'POST', body })
// mcp
const health = await $fetch('/api/health', { baseURL: apiBase })
```

Works with dynamic routes (`/api/appointments/${id}`) and per method. What you **send** (`body`, `query`) is typed with the schemas from `@saas/shared`.
If the editor doesn't see a new endpoint: *TypeScript: Restart TS Server*.

> Web, API and MCP must use the same Nitro major version (currently `nitropack` v2, the one shipped with Nuxt 4).

## Adding an endpoint

1. Schema and types in `packages/shared/src/<resource>.ts` (export from `index.ts`).
2. Handler in `apps/api/server/api/<resource>.<method>.ts`, validating with `readValidatedBody(event, Schema.parse)`.
3. Use it from `web` with `useApi` / `$api`: types show up automatically.

## MCP: data access (pending)

Two options under evaluation:

- **HTTP**: tools call `apps/api` (that's how `api_status` works today, as an example only).
- **Shared package**: `packages/db` (Drizzle) + `packages/core` (use cases) imported by both `api` and `mcp`.

## Adding an MCP tool

1. File at `apps/mcp/server/tools/<name>.ts` following `api-status.ts`: `inputSchema` with zod from `@saas/shared`, `annotations.readOnlyHint` if it changes nothing.
2. Register it in `apps/mcp/server/routes/mcp.ts`.

Test:

```bash
curl -s -X POST localhost:3002/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"api_status","arguments":{}}}'
```

## Environment variables

| App | Variable | Default | Purpose |
|---|---|---|---|
| web | `NUXT_PUBLIC_API_BASE` | `http://localhost:3001` | API URL |
| api | `NITRO_WEB_ORIGIN` | `http://localhost:3000` | Origin allowed by CORS |
| mcp | `NITRO_API_BASE` | `http://localhost:3001` | API URL |
| api | `NITRO_AUTH_SECRET` | *(required, 32+ chars)* | Better Auth secret |
| api | `NITRO_DATABASE_URL` | `postgres://saas_app:saas_app@localhost:5433/saas` | Postgres, as the `saas_app` runtime role (never the owner) |
| api | `NITRO_AUTH_BASE_URL` | `http://localhost:3001` | Public API URL |
| api, mcp | `NITRO_MCP_RESOURCE` | `http://localhost:3002/mcp` | MCP resource URL (token audience) |
| mcp | `NITRO_AUTH_ISSUER` | `http://localhost:3001/api/auth` | OAuth issuer (JWKS at `<issuer>/jwks`) |
| db | `DATABASE_URL` | `postgres://saas:saas@localhost:5433/saas` | Used by drizzle-kit migrations. On Neon use the **direct** (non-pooled) string |

`apps/api` refuses to boot with an invalid config (the error names the offending keys, never the values). Copy `apps/api/.env.example` to `apps/api/.env` and set `NITRO_AUTH_SECRET`. The local Postgres moved from port 5432 to 5433: update any `DATABASE_URL` you had pointing at 5432.

## Multi-tenancy (tenant_id + RLS)

`tenantId` is the organization id. Business tables carry `tenant_id text not null` and enable RLS with `tenantRlsSql('<table>')` from `@saas/db` inside the migration that creates them. Data access goes through `withTenant(db, tenantId, tx => ...)`, which sets the RLS context for one transaction; without it every policy returns no rows.

RLS is ignored by superusers, roles with `BYPASSRLS` and (without `FORCE`) the table owner. So: migrate with the owner (`DATABASE_URL`), run the app as `saas_app` (`NITRO_DATABASE_URL`). On Neon the console-created owner role bypasses RLS: run `db:app-role` against the owner string, then use the `saas_app` pooled string for the app. `pnpm test:db` fails if a business table lacks `tenant_id` or forced RLS, or if the app role can bypass RLS.

## Architecture (hexagonal)

- `packages/core`: domain, ports and use cases. No framework dependencies (enforced by `check:boundaries`).
- `packages/auth`: driven adapter, Better Auth (organization, admin, api-key, agent-auth, mcp/OAuth provider, i18n, OpenAPI) implementing `IdentityProvider`.
- `packages/db`: driven adapter, Drizzle + Postgres. After changing auth plugins run `pnpm --filter @saas/auth auth:schema` then `pnpm --filter @saas/db db:generate`.
- `apps/api`: driving adapter (HTTP) and composition root (`server/utils/container.ts`).
- `apps/mcp`: driving adapter (MCP), protected by OAuth tokens issued by `apps/api`.

## Deployment

The Nitro preset is chosen at build time, so the host is not fixed. The repo default is `aws_lambda`; override it with `NITRO_PRESET`, e.g. for any Node host (VPS, Coolify, Fly, Railway, Docker):

```bash
NITRO_PRESET=node-server pnpm --filter @saas/api build
PORT=3001 NITRO_AUTH_SECRET=... NITRO_DATABASE_URL=... node apps/api/.output/server/index.mjs
```

- `apps/api` and `apps/mcp`: AWS Lambda, using Nitro's `aws_lambda` preset.
- `apps/web`: static via `nuxt generate`, hosted on S3 + CloudFront.

Build each Lambda independently:

```bash
pnpm --filter @saas/api build
pnpm --filter @saas/mcp build
```

For each app, zip the **contents** of its `.output/` directory (so `server/` is at the archive root), then upload to a separate Lambda with the **Node.js 22.x** runtime and handler **`server/index.handler`**. Expose each function through an API Gateway HTTP API with a proxy integration (payload format 2.0) or a Lambda Function URL. The MCP uses stateless JSON responses; Lambda response streaming is not required.

Set `NITRO_WEB_ORIGIN` on the API to the frontend origin, `NITRO_API_BASE` on the MCP to the deployed API URL, and `NUXT_PUBLIC_API_BASE` **when building the static frontend** to that same API URL. Set `NITRO_AUTH_SECRET`, `NITRO_DATABASE_URL` (Neon: use the pooled `-pooler` connection string with `sslmode=require`; each instance opens one connection), `NITRO_AUTH_BASE_URL`, `NITRO_MCP_RESOURCE` and `NITRO_AUTH_ISSUER`.

Use `pnpm dev:api` and `pnpm dev:mcp` for local development. The Lambda build exports a handler rather than a local HTTP server. The old Wrangler `preview` and `deploy` scripts have been removed; AWS infrastructure and deployment automation are not configured in this repository.

**Before exposing the MCP to clients:** scope each token to its business (multi-tenant) and add per-token rate limiting.
