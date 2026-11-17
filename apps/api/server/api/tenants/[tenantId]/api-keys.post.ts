defineRouteMeta({
  openAPI: {
    tags: ['tenants'],
    operationId: 'createTenantApiKey',
    summary: 'Create a tenant API key',
    description:
      'Requires `apikeys:manage` (owner, admin). Scopes are set by the server and callers can only grant scopes they hold. The key value is returned once.',
    security: [{ sessionCookie: [] }, { apiKey: [] }],
    parameters: [{ in: 'path', name: 'tenantId', required: true, description: 'Organization id', schema: { type: 'string' } }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'scopes'],
            properties: {
              name: { type: 'string', description: '1 to 100 characters' },
              scopes: {
                type: 'array',
                description: 'At least one scope',
                items: { type: 'string', enum: ['business:settings', 'business:revenue', 'members:invite', 'agenda:all', 'agenda:own'] },
              },
            },
          },
        },
      },
    },
    responses: {
      200: { description: 'The created key. The `key` field is shown only now.' },
      400: { description: 'Invalid body, or a scope that keys cannot hold' },
      401: { description: 'No valid credentials' },
      403: { description: 'Not allowed to manage keys in this tenant, or granting a scope the caller lacks' },
    },
  },
})

import { GRANTABLE_SCOPES, SCOPE_RESOURCE, type Action } from '@saas/core'
import { API_KEY_CONFIG } from '@saas/auth'
import { z } from 'zod'
import { getContainer } from '../../../utils/container'
import { assertAllowed, requireAccess } from '../../../utils/principal'

const Body = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.custom<Action>((v) => (GRANTABLE_SCOPES as readonly unknown[]).includes(v))).min(1),
})

/**
 * Create a tenant API key. Scopes are set here, on the server: Better Auth refuses client-set
 * `permissions`. The caller must manage keys and may only grant scopes they hold themselves.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const tenantId = getRouterParam(event, 'tenantId') ?? ''
  const principal = await requireAccess(event, config, 'apikeys:manage', tenantId)
  const body = await readValidatedBody(event, Body.parse)

  // Nobody can hand out more than they hold.
  for (const scope of body.scopes) assertAllowed(config, principal, scope, tenantId)

  // No `headers` on purpose: Better Auth treats a call with headers as client-originated and
  // rejects `permissions`. `userId` names the creator; Better Auth re-checks their org permission.
  return getContainer(config).auth.api.createApiKey({
    body: {
      userId: principal.id,
      configId: API_KEY_CONFIG,
      organizationId: tenantId,
      name: body.name,
      permissions: { [SCOPE_RESOURCE]: body.scopes },
    },
  })
})
