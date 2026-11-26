// What each endpoint does once the caller is authenticated. Shared by the HTTP route
// (server/api) and its MCP tool (server/mcp/tools), so both apply the same rules.
// Plain functions: no H3, no Nitro auto-imports. Core errors propagate; each adapter maps them.
import { authorizeAction, type Principal } from '@saas/core'
import type { HealthResponse } from '@saas/shared'

export const health = (): HealthResponse => ({ status: 'ok', service: 'saas-api' })

/** GET /api/me: the caller as the platform sees it. */
export const whoAmI = (principal: Principal): Principal => principal

/** GET /api/tenants/{tenantId}/me: the caller inside one tenant. Requires `agenda:own` there. */
export function tenantMe(principal: Principal, tenantId: string) {
  authorizeAction(principal, 'agenda:own', tenantId)
  return { tenantId, kind: principal.kind, role: principal.role, scopes: principal.scopes }
}
