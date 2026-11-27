# saas-poc-ec

pnpm monorepo: web (Nuxt) and API (Nitro, which also serves MCP at `/mcp`), deployed separately with automatic types between them.

```
apps/
  api/       Nitro → REST API + MCP server (POST /mcp).                 :3001
  web/       Nuxt  → UI. API client.                                    :3000
packages/
  shared/    TypeScript + zod. Shared contract (api, web). No frameworks.
  tokens/    Plain TypeScript + CSS. Design tokens for web, emails and PDFs. No frameworks.
  ui/        Nuxt layer: components, composables and Tailwind adapter. Consumes tokens.
```

## Rules

1. **Business logic is never duplicated.** `web` consumes the API over HTTP. MCP tools run inside the API and call the same endpoint functions as the HTTP routes (see below).
2. **`packages/shared` imports nothing from Vue, Nuxt or Nitro.** Only types, zod schemas and pure functions.
3. **`packages/ui` is for Nuxt apps only.** It may import `shared`; `shared` never imports `ui`.
4. **Don't pass generics to API calls** (`useApi<T>(...)`): they override automatic inference.
5. **`apps/web` never depends on `core`, `db` or `drizzle-orm`**: the browser never touches the database.
6. **`packages/tokens` is framework-agnostic.** No Vue, Nuxt, Nitro or UI-layer dependencies. Tailwind directives and global element styles belong to `packages/ui`, not the token CSS.

Rules 2, 3, 5 and 6 are enforced by `pnpm check:boundaries` (also run by `pnpm check`): it checks each package's declared dependencies and rejects relative imports that leave the package folder. The rules live in `scripts/check-boundaries.mjs`.

## Requirements and commands

```bash
nvm install          # Node per .nvmrc
pnpm install
pnpm dev             # api + web in parallel
pnpm dev:api         # or just one: dev:api | dev:web
pnpm mcp:inspect     # MCP Inspector UI → Streamable HTTP, http://localhost:3001/mcp (OAuth via the same API)
docker compose up -d # Postgres on :5433, Mailpit (SMTP :1025, inbox http://localhost:8025)
pnpm --filter @saas/db db:migrate
APP_DB_PASSWORD=saas_app pnpm --filter @saas/db db:app-role   # runtime DB role without BYPASSRLS (needs the password; use a real secret outside local dev)
pnpm test:db                         # RLS / tenant isolation tests against Postgres
pnpm test            # core, auth, db (pure), api and scripts tests
pnpm e2e:auth        # sign-up, email verification, sessions (api + Postgres + Mailpit running)
pnpm e2e:tenant      # tenant isolation smoke test (api + Postgres + Mailpit running)
pnpm e2e:oauth       # OAuth + MCP smoke test (api + Postgres + Mailpit running)
pnpm typecheck       # api and web
pnpm check           # check:boundaries + typecheck (use in CI)
pnpm build
```

## Design tokens

Import tokens directly without loading the Nuxt layer:

```ts
import { lightTokens, darkTokens, emailTokens, pdfTokens } from '@saas/tokens'
```

For any browser app, import `@saas/tokens/css` (or `@saas/tokens/css/tokens.css`
for older CSS resolvers such as Tailwind 3's PostCSS pipeline) to load plain CSS custom properties
(`:root` for light, `.dark` for dark). Colors are HSL channels, e.g.
`color: hsl(var(--foreground))`. This CSS contains no Tailwind directives or global
body/reset styles. Nuxt apps extending `@saas/ui` load it automatically through the
layer's Tailwind adapter. `@saas/ui/tokens` remains a compatibility re-export; new
consumers should declare a dependency on `@saas/tokens` instead.

Edit `packages/tokens/src/index.ts`, then run `pnpm --filter @saas/tokens build`
to regenerate the committed CSS. `pnpm check:tokens` (also included in `pnpm check`)
checks that CSS and TypeScript stay in sync and that email/PDF exports contain
static values. `@saas/tokens` has its own framework-free TypeScript check.

## Automatic types

Nitro generates the API route types in `apps/api/.nitro/types/nitro-routes.d.ts` (when running `dev` or `prepare`).
`apps/web` (via `nuxt.config.ts`) includes that file, so each endpoint's **response** is inferred automatically:

```ts
const { data } = await useApi('/api/health')          // useFetch → API
const r = await useNuxtApp().$api('/api/appointments', { method: 'POST', body })
```

Works with dynamic routes (`/api/appointments/${id}`) and per method. What you **send** (`body`, `query`) is typed with the schemas from `@saas/shared`.
If the editor doesn't see a new endpoint: *TypeScript: Restart TS Server*.

> Web and API must use the same Nitro major version (currently `nitropack` v2, the one shipped with Nuxt 4).

## Adding an endpoint

1. Schema and types in `packages/shared/src/<resource>.ts` (export from `index.ts`).
2. Handler in `apps/api/server/api/<resource>.<method>.ts`, validating with `readValidatedBody(event, Schema.parse)`.
3. Use it from `web` with `useApi` / `$api`: types show up automatically.

## MCP

`POST /mcp` on the API (Streamable HTTP, stateless). It accepts only OAuth access tokens issued by this API for the MCP resource (`NITRO_MCP_RESOURCE`); anything else gets 401 with an RFC 9728 challenge, and clients discover the authorization server at `/.well-known/oauth-protected-resource/mcp`. Users sign in on the web `/login` (email or Google) and approve on `/consent`.

Tools never forward the token. Each request gets an `agent` principal from the verified claims (`sub`, `tenant_id`) and the user's **current** membership, then runs the same function as the HTTP route (`apps/api/server/utils/endpoints.ts`), so authorization is identical.

## Adding an MCP tool

1. Put the endpoint logic in `apps/api/server/utils/endpoints.ts` and call it from the route.
2. Add `apps/api/server/mcp/tools/<name>.ts` following `tenant-me.ts`: `export const route = 'METHOD /api/...'`, zod input/output, `annotations.readOnlyHint` if it changes nothing, body wrapped in `guarded(...)`.
3. Register it in `apps/api/server/mcp/server.ts` and cover it in `apps/api/test/mcp-tools.test.ts`.

Test with `pnpm mcp:inspect` (it runs the OAuth flow) or `pnpm e2e:oauth`. Outside production local clients register themselves (open dynamic client registration, http loopback callbacks); production only accepts CIMD and pre-registered clients.

## Environment variables

| App | Variable | Default | Purpose |
|---|---|---|---|
| web | `NUXT_PUBLIC_API_BASE` | `http://localhost:3001` | API URL |
| api | `NITRO_WEB_ORIGIN` | `http://localhost:3000` | Origin allowed by CORS |
| api | `NITRO_AUTH_SECRET` | *(required, 32+ chars)* | Better Auth secret |
| api | `NITRO_DATABASE_URL` | `postgres://saas_app:saas_app@localhost:5433/saas` | Postgres, as the `saas_app` runtime role (never the owner) |
| api | `NITRO_AUTH_BASE_URL` | `http://localhost:3001` | Public API URL |
| api | `NITRO_MCP_RESOURCE` | `http://localhost:3001/mcp` | MCP resource URL (token audience). Must be exactly `<NITRO_AUTH_BASE_URL origin>/mcp` |
| db | `DATABASE_URL` | `postgres://saas:saas@localhost:5433/saas` | Used by drizzle-kit migrations. On Neon use the **direct** (non-pooled) string |

`apps/api` refuses to boot with an invalid config (the error names the offending keys, never the values). Copy `apps/api/.env.example` to `apps/api/.env` and set `NITRO_AUTH_SECRET`. The local Postgres moved from port 5432 to 5433: update any `DATABASE_URL` you had pointing at 5432.

## Multi-tenancy (tenant_id + RLS)

`tenantId` is the organization id. Business tables carry `tenant_id text not null` and enable RLS with `tenantRlsSql('<table>')` from `@saas/db` inside the migration that creates them. Data access goes through `withTenant(db, tenantId, tx => ...)`, which sets the RLS context for one transaction; without it every policy returns no rows.

RLS is ignored by superusers, roles with `BYPASSRLS` and (without `FORCE`) the table owner. So: migrate with the owner (`DATABASE_URL`), run the app as `saas_app` (`NITRO_DATABASE_URL`). On Neon the console-created owner role bypasses RLS: run `db:app-role` against the owner string with a strong `APP_DB_PASSWORD`, then use the `saas_app` pooled string for the app. The script verifies the role cannot bypass RLS and fails otherwise; running it again rotates the password to `APP_DB_PASSWORD`. `pnpm test:db` fails if a business table lacks `tenant_id` or forced RLS, or if the app role can bypass RLS.

## Adding an endpoint

Every endpoint needs OpenAPI metadata (`defineRouteMeta`) **and** an MCP tool (`apps/api/server/mcp/tools`, exporting `route = 'METHOD /api/...'`). `pnpm check:api` enforces it. Details and the exemption rule are in [AGENTS.md](./AGENTS.md). Docs are served in dev at `/_scalar`, `/_swagger` and `/_openapi.json`.

## Architecture (hexagonal)

- `packages/core`: domain, ports and use cases. No framework dependencies (enforced by `check:boundaries`).
- `packages/auth`: driven adapter, Better Auth (organization, admin, api-key, agent-auth, mcp/OAuth provider, i18n, OpenAPI) implementing `IdentityProvider`.
- `packages/db`: driven adapter, Drizzle + Postgres. After changing auth plugins run `pnpm --filter @saas/auth auth:schema` then `pnpm --filter @saas/db db:generate`.
- `apps/api`: driving adapters (HTTP routes and the MCP server in `server/mcp`) and composition root (`server/utils/container.ts`).

## Deployment

The Nitro preset is chosen at build time, so the host is not fixed. The repo default is `aws_lambda`; override it with `NITRO_PRESET`, e.g. for any Node host (VPS, Coolify, Fly, Railway, Docker):

```bash
NITRO_PRESET=node-server pnpm --filter @saas/api build
PORT=3001 NITRO_AUTH_SECRET=... NITRO_DATABASE_URL=... node apps/api/.output/server/index.mjs
```

- `apps/api` (HTTP API + MCP): AWS Lambda, using Nitro's `aws_lambda` preset.
- `apps/web`: static via `nuxt generate`, hosted on S3 + CloudFront.

```bash
pnpm --filter @saas/api build
```

Zip the **contents** of `apps/api/.output/` (so `server/` is at the archive root), then upload to a Lambda with the **Node.js 22.x** runtime and handler **`server/index.handler`**. Expose it through an API Gateway HTTP API with a proxy integration (payload format 2.0) or a Lambda Function URL. MCP uses stateless JSON responses; Lambda response streaming is not required.

Set `NITRO_WEB_ORIGIN` on the API to the frontend origin, and `NUXT_PUBLIC_API_BASE` **when building the static frontend** to the API URL. Set `NITRO_AUTH_SECRET`, `NITRO_DATABASE_URL` (Neon: use the pooled `-pooler` connection string with `sslmode=require`; each instance opens one connection), `NITRO_AUTH_BASE_URL` and `NITRO_MCP_RESOURCE` (`<API URL>/mcp`).

Use `pnpm dev:api` for local development. The Lambda build exports a handler rather than a local HTTP server. The old Wrangler `preview` and `deploy` scripts have been removed; AWS infrastructure and deployment automation are not configured in this repository.

**Before exposing the MCP to clients:** add per-token rate limiting. Tokens are already scoped to one business (`tenant_id`).
