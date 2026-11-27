import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ACTIONS, ROLES } from '@saas/core'
import { z } from 'zod'
import { tenantMe } from '../../utils/endpoints.ts'
import { guarded, ok, type ToolContext } from '../server.ts'

/** The API endpoint this tool exposes. Checked by `pnpm check:api`. */
export const route = 'GET /api/tenants/{tenantId}/me'

/** Read-only: the agent's identity inside one tenant. Same authorization as the HTTP route. */
export function register(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    'tenant_me',
    {
      title: 'Who am I in this tenant',
      description: 'Returns the agent identity and role inside the tenant it was authorized for. Any other tenant is denied.',
      inputSchema: {
        tenantId: z.string().optional().describe('Tenant (organization) id. Defaults to the tenant the user authorized.'),
      },
      outputSchema: {
        tenantId: z.string(),
        kind: z.enum(['user', 'apiKey', 'agent']),
        role: z.enum(ROLES).optional(),
        scopes: z.array(z.enum(ACTIONS)).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    ({ tenantId }) =>
      guarded(async () => {
        const target = tenantId ?? ctx.tokenTenantId ?? ''
        ctx.setTenant(target)
        return ok(tenantMe(await ctx.principal(), target))
      }),
  )
}
