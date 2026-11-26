# Design

## Context

See proposal.md (Why) for motivation and the OAuth research. Current state that shapes the approach:

- `apps/api` already hosts the authorization server: `packages/auth` `createAuth` registers `jwt()`, `mcp({ resource })`, `cimd()` and `organization()`, and the composition root (`apps/api/server/utils/container.ts`) builds it once per Lambda container. `routes/.well-known/[...path].ts` proxies RFC 8414 documents from the host root to `/api/auth/.well-known/*` (`utils/discovery.ts`).
- Access tokens are JWTs with `sub`, `aud = mcpResource` and `tenant_id` (only while the user is a member at issue/refresh, `adapters/tenant-claim.ts`).
- `apps/mcp` has one route (`routes/mcp.ts`, `createMcpProtectedRequestHandler` with a remote JWKS URL), a hand-written RFC 9728 route, one tool (`api_status`, `$fetch` to `/api/health`) and a unit test of the verifier.
- `packages/auth/adapters/agent-principal.ts` already maps `{ userId, tenantId, memberRole }` to an `agent` `Principal`; `@saas/db` exports `findMemberRole`.
- HTTP routes authorize through `requirePrincipal` / `requireAccess` (`utils/principal.ts`), which map core errors to 401/403.
- `scripts/check-api-contract.mjs` reads tools from `apps/mcp/server/tools`.

## Goals / Non-Goals

**Goals:**
- One Nitro app and one auth instance serve both HTTP API and MCP.
- A tool and its HTTP route run the same function after authentication; only the transport adapter differs.
- Agent principals come from verified claims plus a fresh membership lookup, never from forwarding tokens.

**Non-Goals:**
- Scope-per-tool enforcement (`requiredScopes`): tokens carry OIDC scopes only today.
- DPoP-bound tokens: the plugin supports them; nothing here turns them on.
- Changing the OAuth consent, CIMD or token claims.

## Decisions

1. **Serve MCP from `apps/api/server/routes/mcp.ts` with `requireMcpAuth(auth, handler, { resource, issuer })`.**
   Verification reads keys from the auth instance in-process and the DPoP replay store uses the database. `requireMcpAuth` already resolves its verifier inside each call (1.7.27), so there is no cache to keep: the route wraps it per request, which lets the tools close over the H3 `event` (needed for `event.context.tenantId` in the request log). `resource` must be passed (`cfg.mcpResource`): its default is the auth base URL (`…/api/auth`), not `/mcp`. `issuer` defaults to that same base URL, which is what tokens carry today; pass it explicitly anyway so a future `jwt.issuer` change fails loudly. The verifier also requires an `azp` claim; `e2e:oauth` proves real tokens pass (it needs Postgres for the signing keys, so this is not a unit test).
   *Alternative:* keep `createMcpProtectedRequestHandler` with `jwksUrl` pointing at its own origin. Rejected: a self HTTP call on cold start and an in-memory replay store that the library flags as unsafe on serverless.
   The MCP server and transport stay per request (stateless, `enableJsonResponse`), as today.

2. **Default resource URL `http://localhost:3001/mcp`.**
   `mcpResource` must be the URL clients call, so it becomes `<API origin>/mcp` (`NITRO_MCP_RESOURCE`). `ConfigSchema` adds a rule that `mcpResource` has the same origin as `authBaseUrl`, so a stale `:3002` value fails at startup instead of producing tokens nobody accepts.

3. **RFC 9728 metadata through the existing discovery proxy.**
   Add `oauth-protected-resource` to `utils/discovery.ts`: `oauth-protected-resource` and `oauth-protected-resource/mcp` map to the plugin's path under `/api/auth/.well-known/`; other suffixes return null (404). The exact plugin path is verified in the unit test and in `e2e:oauth` (follow the challenge's `resource_metadata`). Delete the hand-written route; no second copy of the metadata.
   *Alternative:* keep `isResourceMetadataPath` and the hand-written JSON. Rejected: duplicates what the plugin serves and can drift (e.g. DPoP algorithms).

4. **Agent principal from claims: `mcpPrincipal` in `packages/auth`.**
   `mcpPrincipal(claims, findMemberRole)`: needs a string `sub`; with a string `tenant_id` it looks up the current role and returns `agentPrincipal(...)`; without it returns `{ kind: 'agent', id: sub }` (no tenant, so every tenant authorization fails). The container wires it with the db: `authenticateMcp(claims)`. Pure, unit-tested in `packages/auth/test`.
   *Alternative:* build the principal in apps/api. Rejected: the mapping is identity-adapter logic and sits next to `agentPrincipal` and `tenantClaims`.

5. **Shared endpoint logic: one function per endpoint, two thin adapters.**
   Endpoint behavior after authentication moves to plain functions in `apps/api/server/utils/endpoints.ts` (e.g. `health()`, `whoAmI(principal)`, `tenantMe(principal, tenantId)` which calls `authorize(principal, 'agenda:own', tenantId)`). The route handler calls `requirePrincipal`/`requireAccess` and then the function; the tool calls `authenticateMcp` and then the same function. Core `ForbiddenError`/`UnauthenticatedError` become one generic MCP tool error (`isError: true`, text `Forbidden` / `Unauthorized`), mirroring the identical-403 rule.
   Tools live in `apps/api/server/mcp/tools/<name>.ts` (outside Nitro's scanned dirs, explicit imports), each exporting `route` and a `register(server, ctx)`; `server/mcp/server.ts` registers them all. Tool input for `tenantId` defaults to the token's `tenant_id`, so the agent does not have to know it, and any other value is denied.
   *Alternative:* tools call the routes through Nitro's in-process `$fetch` with headers. Rejected: still needs a credential the route understands (token passthrough in disguise) and keeps the typed-route hack.

6. **Contract checker moves with the tools.**
   `TOOLS_DIR` = `apps/api/server/mcp/tools`; the checker test fixtures follow. Exemptions for `GET /api/me` and `GET /api/tenants/{tenantId}/me` are removed (the checker would flag them stale anyway); `POST /api/tenants/{tenantId}/api-keys` keeps its entry with the reason reduced to the human-confirmation design.

7. **Delete `apps/mcp` entirely.**
   Move its verifier test idea to the new route (no token / bad audience / valid token) and drop `isResourceMetadataPath`. Remove references in root `package.json` (`dev:mcp`, `typecheck` filter), `lefthook.yml` globs, `eslint.config.mjs`, CI env, README, AGENTS.md, `.env.example`, and `apps/mcp/.env` (local, gitignored). `pnpm-lock.yaml` regenerates.

8. **OAuth login uses the real `/login`; one web auth client.**
   Current state: `mcp({ loginPage: '/sign-in' })` points at an old page built on `useAuthClient` (with `oauthProviderClient`), while `/login` (`Credentials.client.vue`) uses `useAuth()` → `createWebAuthClient`, which has no OAuth plugin. So the real login never forwards `oauth_query`, and the old one has no Google.
   Verified in `@better-auth/oauth-provider` 1.7.27: a `before` hook reads `oauth_query` from any POST body, checks its signature, stores it in the OAuth state, and for `/sign-in/social` also in the server context that survives the provider redirect; an `after` hook on any response that sets a session cookie re-runs `/oauth2/authorize`. Email sign-in therefore returns `{ url }` to the consent page, and the Google callback redirects there directly.
   Changes: add `oauthProviderClient()` to `createWebAuthClient` (no `organizationClient`: nothing on the remaining pages uses it); in `Credentials`, after `signIn.email`, when the page carries a signed OAuth query and the API answers `{ redirect: true, url }`, follow that `url`, else go to `/auth/complete`. No origin allowlist: the URL is built by the API from the client's registered `redirect_uri`, and it legitimately points at the agent's own callback when consent was already given (consent is skipped). Google needs no change beyond the plugin. `loginPage` → `${webOrigin}/login`. `consent.vue` uses `useAuth()`, the auth layout and Spanish copy. Delete `sign-in.vue`, `useAuthClient.ts` and its route rule.
   Registration inside the flow does not resume (sign-up gives no session until verification); after verifying, the user restarts from the agent. Accepted to keep the flow simple.
   *Alternative:* keep `/sign-in` and add Google to it. Rejected: two login screens with diverging rules.

## Risks / Trade-offs

- [Shared Lambda: an MCP bug or load spike affects the HTTP API] → MCP is stateless and low traffic now; splitting later only means deploying the same app twice with different route sets, since the code no longer depends on being separate.
- [Bigger bundle and cold start from `@modelcontextprotocol/sdk`] → check `.output` size before/after in the build task; import the SDK only from `routes/mcp.ts` so Nitro keeps it in that chunk.
- [`requireMcpAuth` resource default is the auth base URL, not `/mcp`, and it requires `azp`] → explicit `issuer` and `resource`; `e2e:oauth` mints a real token and calls `/mcp`, and joins CI now that it needs no second app.
- [Local `.env` files still point `NITRO_MCP_RESOURCE` at the old MCP port] → the new same-origin config rule refuses to start and names the key; the task updates `.env.example` and tells the developer to fix their gitignored `.env`.
- [Global middleware (CORS, request log) now sees `/mcp`] → CORS only acts on the web origin; request log already logs pathname only. Tools set `event.context.tenantId` so denied MCP calls are logged like HTTP ones.
- [Following `result.data.url` becomes an open redirect] → the URL only comes from the API's sign-in response, never from the page query, and is followed only while a signed OAuth query is present; the API validates `redirect_uri` against the registered client. Covered by a web unit test (no signed query → `/auth/complete` even if the response has a `url`).
- [`oauthProviderClient` adds `oauth_query` to every POST on a page with `sig` in the query] → only the login and consent pages ever carry that query; normal web login has none, and the Playwright suite checks normal login is unchanged.
- [Tool errors leak tenant existence] → one forbidden message for every denial, tested with a foreign tenant id.

## Migration Plan

1. Land the in-process route, tools and checker change with `apps/mcp` deleted in the same branch; `pnpm check`, `pnpm test`, `pnpm e2e:oauth` (now against `http://localhost:3001/mcp`) must pass.
2. First production deploy uses `NITRO_MCP_RESOURCE=https://<api host>/mcp` from the start. Nothing is in production yet, so there are no clients, tokens or MCP Lambda to migrate or retire.
3. Rollback: revert the branch.
