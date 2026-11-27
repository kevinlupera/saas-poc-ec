import type { HealthResponse } from '@saas/shared'
import { health } from '../utils/endpoints'

defineRouteMeta({
  openAPI: {
    tags: ['health'],
    operationId: 'getHealth',
    summary: 'API health check',
    description: 'Public. Returns the service status.',
    responses: {
      200: {
        description: 'Service is up',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status', 'service'],
              properties: { status: { type: 'string', enum: ['ok'] }, service: { type: 'string' } },
            },
          },
        },
      },
    },
    // Hoisted to the spec's `components`: the credentials every protected endpoint accepts.
    $global: {
      components: {
        securitySchemes: {
          sessionCookie: { type: 'apiKey', in: 'cookie', name: 'better-auth.session_token' },
          apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' },
        },
      },
    },
  },
})

export default defineEventHandler((): HealthResponse => health())
