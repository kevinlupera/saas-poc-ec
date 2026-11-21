import { ROLE_ACTIONS } from '../../domain/role.ts'
import { ForbiddenError } from '../errors.ts'
import type { AuthorizeAction } from '../ports/in/authorize-action.ts'

export const authorizeAction: AuthorizeAction = (principal, action, tenantId) => {
  // Same error for wrong tenant and missing permission: never reveal that another tenant exists.
  const sameTenant = principal.tenantId !== undefined && principal.tenantId === tenantId
  const byRole = principal.role !== undefined && ROLE_ACTIONS[principal.role].includes(action)
  const byScope = principal.scopes?.includes(action) === true
  if (!sameTenant || !(byRole || byScope)) throw new ForbiddenError(`Not allowed: ${action}`)
}
