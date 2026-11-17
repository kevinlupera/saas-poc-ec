import type { Action } from '../../../domain/role.ts'
import type { Principal } from '../../../domain/principal.ts'

/** Driving port. Rejects with `ForbiddenError`. */
export type AuthorizeAction = (principal: Principal, action: Action) => void
