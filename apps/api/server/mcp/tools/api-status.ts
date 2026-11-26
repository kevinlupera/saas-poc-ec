import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { HealthResponseSchema } from '@saas/shared'
import { health } from '../../utils/endpoints.ts'
import { ok } from '../server.ts'

/** The API endpoint this tool exposes. Checked by `pnpm check:api`. */
export const route = 'GET /api/health'

/** Read-only: whether the platform API is available. Needs no tenant. */
export function register(server: McpServer) {
  server.registerTool(
    'api_status',
    {
      title: 'API status',
      description: 'Checks whether the platform API is available.',
      inputSchema: {},
      outputSchema: HealthResponseSchema.shape,
      annotations: { readOnlyHint: true },
    },
    () => ok(health()),
  )
}
