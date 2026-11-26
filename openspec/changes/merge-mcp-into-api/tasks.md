# Tasks

## 1. Dependencies and config

- [x] 1.1 Add `@modelcontextprotocol/sdk`, `@cfworker/json-schema` and `@better-auth/mcp` (same versions as `apps/mcp`) to `apps/api` (no `jose`: token tests run in `e2e:oauth`). Verify: `pnpm install` succeeds and `pnpm check:boundaries` passes
- [x] 1.2 Write failing tests in `apps/api/test/config.test.ts`: `mcpResource` other than `<authBaseUrl origin>/mcp` (other origin or other path) fails naming `mcpResource` (no values); `http://localhost:3001/mcp` with `authBaseUrl` `http://localhost:3001` passes. Then add the rule in `container.ts` and change the `mcpResource` default in `apps/api/nitro.config.ts`, `apps/api/.env.example`, CI env, `apps/api/test/config.test.ts` and `packages/auth/test/email.test.ts` to `http://localhost:3001/mcp`; set the local gitignored `apps/api/.env` `NITRO_MCP_RESOURCE` to `<NITRO_AUTH_BASE_URL>/mcp`. Verify: `pnpm --filter @saas/api test` passes and `pnpm dev:api` starts

## 2. Agent principal from token claims

- [x] 2.1 Write failing tests in `packages/auth/test/` for `mcpPrincipal(claims, findMemberRole)`: member with `tenant_id` → `agent` with tenant and role; `tenant_id` but no membership → agent without tenant; no `tenant_id` → agent without tenant; missing/non-string `sub` → throws `UnauthenticatedError`. Verify: `pnpm --filter @saas/auth test` fails for the right reason
- [x] 2.2 Implement `mcpPrincipal` in `packages/auth/src/adapters/` next to `agentPrincipal`, export it, and wire `authenticateMcp(claims)` in `container.ts` with `findMemberRole` on the container db. Verify: tests from 2.1 pass, `pnpm check:boundaries` passes

## 3. MCP endpoint in apps/api

- [x] 3.1 Extend `scripts/e2e-oauth.sh` first (signing keys live in Postgres, so this cannot be a unit test): default `MCP_RESOURCE` to `$B/mcp`; no token → 401 with `resource_metadata=`; session cookie only and `x-api-key` only → 401; a token minted for another `resource` → 401; valid token → 200 on `tools/list`. Verify: `pnpm e2e:oauth` fails against the API because `/mcp` does not exist yet
- [x] 3.2 Add `apps/api/server/routes/mcp.ts`: per request, `requireMcpAuth(getContainer(...).auth, handler, { resource: cfg.mcpResource, issuer: <authBaseUrl>/api/auth })` with a per-request `McpServer` + stateless `WebStandardStreamableHTTPServerTransport` (`enableJsonResponse`, `CfWorkerJsonSchemaValidator`). Verify: `pnpm e2e:oauth` assertions from 3.1 pass and `pnpm --filter @saas/web typecheck` still passes (web includes the API route types)
- [x] 3.3 Extend `utils/discovery.ts` so `oauth-protected-resource` and `oauth-protected-resource/mcp` pass through to the plugin (it answers at the root path) and other suffixes return null; add cases to `apps/api/test/discovery.test.ts`. Verify: test passes and, with `pnpm dev:api`, `curl localhost:3001/.well-known/oauth-protected-resource/mcp` returns `resource` = the MCP URL and `authorization_servers` with the API issuer; `/other` returns 404

## 4. Shared endpoint logic and tools

- [x] 4.1 Move post-authentication logic of `health.get.ts`, `me.get.ts` and `tenants/[tenantId]/me.get.ts` into plain functions in `apps/api/server/utils/endpoints.ts` and make the route handlers call them. Verify: `pnpm e2e:tenant` passes unchanged and `pnpm check` passes
- [x] 4.2 Write failing unit tests for the tool layer (tools take `authenticateMcp` and the shared functions as injected dependencies, so no DB is needed): `tenant_me` for a member returns the same tenant and role as the route, with `kind: 'agent'`; foreign `tenantId`, revoked membership and missing `tenant_id` all return the same forbidden tool error; `tenantId` defaults to the token's `tenant_id`. Verify: tests fail for the right reason
- [x] 4.3 Add `apps/api/server/mcp/tools/{api-status,me,tenant-me}.ts` (each exports `route`, read-only annotation, zod output schemas) and `apps/api/server/mcp/server.ts` registering them; tools call `authenticateMcp` then the shared functions, map core errors to one generic tool error, and set `event.context.tenantId`. Verify: tests from 4.2 pass and `pnpm typecheck` passes

## 5. Contract check

- [x] 5.1 Point `scripts/check-api-contract.mjs` `TOOLS_DIR` and its messages at `apps/api/server/mcp/tools`, update fixtures in `scripts/check-api-contract.test.mjs`, remove the `GET /api/me` and `GET /api/tenants/{tenantId}/me` exemptions and shorten the api-keys reason to the human-confirmation design. Verify: `pnpm check:api` and `pnpm test` pass

## 6. Remove apps/mcp

- [x] 6.1 Delete `apps/mcp` and remove its references: root `package.json` (`dev:mcp`, `typecheck` filter), `lefthook.yml` globs, `eslint.config.mjs`, `packages/shared/src/index.ts` and `packages/auth/src/auth.ts` comments; regenerate `pnpm-lock.yaml`. Verify: `grep -rn "apps/mcp\|@saas/mcp\|3002" --exclude-dir=node_modules --exclude-dir=archive .` finds only historical openspec changes, and `pnpm check` passes
- [x] 6.2 Update AGENTS.md (layout table, API contract tool path, drop the "Open decision", describe the delegation model: principal from claims + current membership, no token forwarding) and README (layout, ports, `mcp:inspect` URL, env table, add-a-tool steps, deploy). Verify: documented commands and URLs run as written

## 7. OAuth login parity (web)

- [ ] 7.1 Write failing web unit tests (`apps/web/tests/`): `createWebAuthClient` adds `oauth_query` to a POST when `location.search` holds a signed query and not otherwise; the continuation helper returns the API's `url` (any origin, e.g. the agent's callback when consent is skipped) only when a signed query is present and the response has `redirect: true`, and `/auth/complete` otherwise. Verify: `pnpm --filter @saas/web test:auth` fails for the right reason
- [ ] 7.2 Add `oauthProviderClient()` to `createWebAuthClient`; in `Credentials.client.vue` follow the API continuation URL after `signIn.email` through that helper; switch `consent.vue` to `useAuth()`, the auth layout and Spanish copy; delete `pages/sign-in.vue`, `composables/useAuthClient.ts` and the `/sign-in` rule in `nuxt.config.ts`. Verify: tests from 7.1 pass and `pnpm --filter @saas/web typecheck` passes
- [ ] 7.3 Set `loginPage: ${webOrigin}/login` in `packages/auth/src/auth.ts`. Verify: `curl -i` of `/api/auth/oauth2/authorize?...` without a session redirects to `<web>/login?...&sig=...`
- [ ] 7.4 Extend `apps/web/tests/e2e/auth.spec.ts`: on `/login?<signed query>` email sign-in posts `oauth_query` and navigates to the returned consent URL; Google sign-in posts `oauth_query` to `sign-in/social`; plain `/login` still ends at `/auth/complete`; consent accept/deny follow the returned URL. Verify: `pnpm --filter @saas/web test:e2e` passes
- [ ] 7.5 Manual check with Google configured (`NITRO_GOOGLE_CLIENT_ID/SECRET`): start the OAuth flow from MCP Inspector, sign in with Google, land on `/consent`, accept, and get a token. Verify: record the result in the PR description

## 8. Integration

- [ ] 8.1 Finish `scripts/e2e-oauth.sh`: follow the 401 challenge's `resource_metadata` and assert it names the API issuer, call `tools/call` `tenant_me` asserting the token tenant, and check the anonymous authorize redirect goes to `/login`; add `pnpm e2e:oauth` to `.github/workflows/ci.yml` after `e2e:tenant` (it only needs the API now). Verify: `pnpm e2e:oauth` passes locally and in CI with only api + Postgres + Mailpit
- [ ] 8.2 Compare `pnpm --filter @saas/api build` `.output` size before and after and record it in the PR description. Verify: build succeeds, `pnpm check` and `pnpm test` pass

## Workflow follow-up

- First production deploy sets `NITRO_MCP_RESOURCE=https://<api host>/mcp`.
- Archive the change after review and merge.
