import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { HEALTH_PATH, HealthResponseSchema } from '@saas/shared'

/**
 * Example tool (read-only): checks the status of apps/api.
 * Pattern: input/output via zod from @saas/shared, `readOnlyHint` when it changes nothing.
 * Data access (HTTP to the API or shared packages) is still undecided.
 */
export function registerApiStatus(server: McpServer, apiBase: string) {
  server.registerTool(
    'api_status',
    {
      title: 'API status',
      description: 'Checks whether the platform API is available.',
      inputSchema: {},
      outputSchema: HealthResponseSchema.shape,
      annotations: { readOnlyHint: true },
    },
    async () => {
      // Type inferred from apps/api/server/api/health.get.ts
      const health = await $fetch(HEALTH_PATH as '/api/health', { baseURL: apiBase })
      return {
        content: [{ type: 'text', text: JSON.stringify(health) }],
        structuredContent: health,
      }
    },
  )
}
