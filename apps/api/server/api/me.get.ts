defineRouteMeta({
  openAPI: {
    tags: ['identity'],
    operationId: 'getMe',
    summary: 'Who am I',
    description: 'Resolves the caller (session cookie or tenant API key) to its principal.',
    security: [{ sessionCookie: [] }, { apiKey: [] }],
    responses: {
      200: {
        description: 'The authenticated principal',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Principal' } } },
      },
      401: { description: 'No valid credentials' },
    },
    $global: {
      components: {
        schemas: {
          Principal: {
            type: 'object',
            required: ['kind', 'id'],
            properties: {
              kind: { type: 'string', enum: ['user', 'apiKey', 'agent'] },
              id: { type: 'string' },
              tenantId: { type: 'string', description: 'Organization the principal acts in' },
              role: { type: 'string', enum: ['owner', 'admin', 'recepcion', 'profesional'] },
              scopes: { type: 'array', items: { type: 'string' } },
              platformRole: { type: 'string', enum: ['superadmin', 'soporte', 'finanzas'] },
              twoFactorRequired: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
})

import { requirePrincipal } from '../utils/principal'

export default defineEventHandler((event) => requirePrincipal(event, useRuntimeConfig(event)))
