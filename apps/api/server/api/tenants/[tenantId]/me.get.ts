defineRouteMeta({
  openAPI: {
    tags: ['tenants'],
    operationId: 'getTenantMe',
    summary: 'Who am I in this tenant',
    description: 'Requires the `agenda:own` action inside the tenant. 403 for any other tenant, with the same body as a missing permission.',
    security: [{ sessionCookie: [] }, { apiKey: [] }],
    parameters: [{ in: 'path', name: 'tenantId', required: true, description: 'Organization id', schema: { type: 'string' } }],
    responses: {
      200: {
        description: 'The principal inside the tenant',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['tenantId', 'kind'],
              properties: {
                tenantId: { type: 'string' },
                kind: { type: 'string', enum: ['user', 'apiKey', 'agent'] },
                role: { type: 'string' },
                scopes: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      401: { description: 'No valid credentials' },
      403: { description: 'Not a member of this tenant, or the action is not allowed' },
    },
  },
})

import { tenantMe } from '../../../utils/endpoints'
import { asHttp, requirePrincipal } from '../../../utils/principal'

/** Who am I in this tenant? Reference route: authenticate, then the shared logic authorizes. */
export default defineEventHandler(async (event) => {
  const tenantId = getRouterParam(event, 'tenantId') ?? ''
  // Logged even when access is denied, so cross-tenant attempts are visible.
  event.context.tenantId = tenantId
  const principal = await requirePrincipal(event, useRuntimeConfig(event))
  return asHttp(() => tenantMe(principal, tenantId))
})
