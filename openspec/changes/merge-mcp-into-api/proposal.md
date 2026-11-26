# Proposal

## Why

`apps/mcp` is a second Nitro/Lambda app that reimplements what `apps/api` already owns: OAuth token verification (JWKS fetched over HTTP from the API), RFC 9728 metadata written by hand, a duplicated `authIssuer`/`mcpResource` config, and a cross-app tsconfig hack to type `$fetch` calls back into the API. Worse, it cannot reach tenant data without forwarding the agent's token to the API (token passthrough, forbidden by the MCP spec), so every authenticated endpoint is exempt from the "every endpoint has an MCP tool" rule. Serving MCP from `apps/api`, the same process as the authorization server, removes the duplication and the passthrough problem at once.

Research on the OAuth side (Better Auth `@better-auth/mcp` 1.7.27, MCP authorization spec):

- The MCP spec allows the authorization server and the resource server to be the same host; the separation is logical (token audience), not physical.
- `requireMcpAuth(auth, handler)` is the plugin's handler for that co-located case: it verifies tokens with the auth instance's own keys (no JWKS HTTP call, no cold-start fetch) and keeps the DPoP replay store in the database. The standalone handler used today keeps replay state in memory, which the library itself flags as unsafe on serverless.
- The `mcp()` plugin already serves the RFC 9728 protected-resource metadata; only a root `/.well-known` proxy entry is missing.
- Once the MCP handler runs in-process, a tool builds a `Principal` from the verified claims (`sub`, `tenant_id`) and the user's current membership, then calls the same authorization and use cases as the HTTP route. No token is forwarded anywhere, which resolves the open "delegation" decision in AGENTS.md.

Trade-offs accepted: API and MCP share one Lambda (blast radius, cold start, bundle size grows by the MCP SDK). At this stage one deployable is cheaper than two, and MCP traffic is low.

## What Changes

- The MCP endpoint moves from `apps/mcp` (`http://localhost:3002/mcp`) to `apps/api` at `<API origin>/mcp`, and `NITRO_MCP_RESOURCE` changes accordingly. Not breaking in practice: the project has not shipped to production, so there are no external MCP clients or issued tokens to migrate.
- `apps/api` serves `POST /mcp` (Streamable HTTP, stateless, JSON responses) protected with `requireMcpAuth` using the existing auth instance.
- RFC 9728 metadata is served by Better Auth and exposed at the host root (`/.well-known/oauth-protected-resource[/mcp]`) through the existing discovery proxy; the hand-written route is removed.
- MCP tools run in-process: they authenticate as an `agent` principal built from the token claims plus current membership (reusing `agentPrincipal` and `authorizeAction`), and share the handler logic with the HTTP route instead of calling it over HTTP.
- Tools are added for `GET /api/me` and `GET /api/tenants/{tenantId}/me`, so their contract exemptions go away. `POST /api/tenants/{tenantId}/api-keys` stays exempt (minting credentials needs a human-confirmation design).
- `apps/mcp` is deleted (package, config, scripts, CI and lint references). `pnpm check:api` looks for tools under `apps/api`.
- AGENTS.md and README drop the "open decision" and describe the new delegation model and tool location.
- **OAuth login parity.** The authorization server sends users to `/sign-in`, an older English page with email/password only, no Google, and a sign-up that breaks under required email verification. The OAuth `loginPage` becomes the real `/login` (email/password + Google), the web auth client forwards the signed OAuth query (`oauthProviderClient`) so both methods resume the authorization (Better Auth already resumes it after the Google callback), the consent page moves to the auth layout in Spanish, and `sign-in.vue` plus the duplicate `useAuthClient` are removed.

Out of scope: a tenant picker for OAuth consent, scope-based tool restrictions, and splitting MCP into its own Lambda again (possible later by deploying the same app twice with different route sets).

## Capabilities

### New Capabilities
- `agents/mcp-server`: the MCP endpoint for third-party agents: where it is served, how it is protected with OAuth (audience, challenge, discovery metadata), how a tool acts for the user (principal from claims, current-membership authorization, no token forwarding), and the rule that every API endpoint has a tool or a reasoned exemption.

### Modified Capabilities
- `identity/user-auth`: adds sign-in during an agent authorization (same login methods as the web, resuming the authorization) and the agent consent screen. Existing requirements are unchanged. `identity/auth-api` is still an in-flight change (`connect-auth-backend`) and is not touched.

## Impact

- Code: `apps/api/server` (new `/mcp` route, MCP tools, principal-from-claims helper, discovery proxy entry), `packages/auth` (`mcpPrincipal`, OAuth `loginPage`), removal of `apps/mcp`.
- Web: `apps/web/app/utils/auth-client.ts` (OAuth client plugin), `components/auth/Credentials.client.vue` (follow the API continuation URL), `pages/consent.vue`, removal of `pages/sign-in.vue`, `composables/useAuthClient.ts` and the `/sign-in` route rule; web unit and Playwright tests.
- Scripts and CI: `scripts/check-api-contract.mjs` (+ test), `scripts/api-contract.exemptions.json`, `scripts/e2e-oauth.sh` (resource URL, MCP assertions), and `e2e:oauth` added to CI.
- Config: `NITRO_MCP_RESOURCE` default and `.env.example`, CI workflow env, root `package.json` (`dev:mcp`, `typecheck`), `lefthook.yml`, `eslint.config.mjs`.
- Dependencies: `@modelcontextprotocol/sdk`, `@cfworker/json-schema` and `@better-auth/mcp` move to `apps/api`.
- Deployment: one Lambda instead of two. Nothing is in production yet, so no client or token migration.
