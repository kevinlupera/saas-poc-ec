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
pnpm mcp:inspect     # MCP Inspector UI → Streamable HTTP, http://localhost:3002/mcp
                     # (if NITRO_MCP_TOKEN is set, add `Authorization: Bearer <token>` in its auth field)
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
| mcp | `NITRO_MCP_TOKEN` | *(empty)* | If set, requires `Authorization: Bearer <token>` |

## Deployment

- `apps/api` and `apps/mcp`: Cloudflare Workers (`pnpm --filter @saas/api deploy`, `pnpm --filter @saas/mcp deploy`).
- `apps/web`: static via `nuxt generate` (S3 + CloudFront, Cloudflare Pages, etc.).

**Before exposing the MCP to clients:** replace the shared token with OAuth and scope each token to its business (multi-tenant), plus per-token rate limiting.
