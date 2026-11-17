import { ROLE_ACTIONS } from '../../domain/role.ts'
import { ForbiddenError } from '../errors.ts'
import type { AuthorizeAction } from '../ports/in/authorize-action.ts'

export const authorizeAction: AuthorizeAction = (principal, action) => {
  if (!principal.role || !ROLE_ACTIONS[principal.role].includes(action)) {
    throw new ForbiddenError(`Not allowed: ${action}`)
  }
}
