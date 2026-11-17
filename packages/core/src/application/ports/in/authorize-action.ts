import type { Action } from '../../../domain/role.ts'
import type { Principal } from '../../../domain/principal.ts'

/**
 * Driving port. Every action happens inside a tenant: the principal must belong to
 * `tenantId` and hold the action by role or by scope. Rejects with `ForbiddenError`.
 */
export type AuthorizeAction = (principal: Principal, action: Action, tenantId: string) => void
