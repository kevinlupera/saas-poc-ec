import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ACTIONS, PLATFORM_ROLES, ROLES } from '@saas/core'
import { z } from 'zod'
import { whoAmI } from '../../utils/endpoints.ts'
import { guarded, ok, type ToolContext } from '../server.ts'

/** The API endpoint this tool exposes. Checked by `pnpm check:api`. */
export const route = 'GET /api/me'

/** Read-only: who the agent is acting as. */
export function register(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    'me',
    {
      title: 'Who am I',
      description: 'Returns the identity the agent acts as: the user who authorized it, and the tenant and role it acts in.',
      inputSchema: {},
      outputSchema: {
        kind: z.enum(['user', 'apiKey', 'agent']),
        id: z.string(),
        tenantId: z.string().optional(),
        role: z.enum(ROLES).optional(),
        scopes: z.array(z.enum(ACTIONS)).optional(),
        platformRole: z.enum(PLATFORM_ROLES).optional(),
        twoFactorRequired: z.boolean().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    () => guarded(async () => ok(whoAmI(await ctx.principal()))),
  )
}
