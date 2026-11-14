import { z } from 'zod'

export const HEALTH_PATH = '/api/health'

/** GET /api/health response. Returned by the API; consumed by web and MCP. */
export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
})
export type HealthResponse = z.infer<typeof HealthResponseSchema>
