import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { HealthResponseSchema } from '@saas/shared'

/** The API endpoint this tool exposes. Checked by `pnpm check:api`. */
export const route = 'GET /api/health'

/** Read-only: whether the platform API is available. */
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
    () => {
      const health = { status: 'ok' as const, service: 'saas-api' }
      return { content: [{ type: 'text', text: JSON.stringify(health) }], structuredContent: health }
    },
  )
}
