import { requireAccess } from '../../../utils/principal'

/** Who am I in this tenant? Reference route showing the tenant check every tenant route must do. */
export default defineEventHandler(async (event) => {
  const tenantId = getRouterParam(event, 'tenantId') ?? ''
  const principal = await requireAccess(event, useRuntimeConfig(event), 'agenda:own', tenantId)
  return { tenantId, kind: principal.kind, role: principal.role, scopes: principal.scopes }
})
