import type { HealthResponse } from '@saas/shared'

export default defineEventHandler((): HealthResponse => ({
  status: 'ok',
  service: 'saas-api',
}))
