import { PLATFORM_ROLE_ACTIONS } from '../../domain/platform.ts'
import { ForbiddenError, TwoFactorRequiredError } from '../errors.ts'
import type { AuthorizePlatformAction } from '../ports/in/authorize-platform-action.ts'

export const authorizePlatformAction: AuthorizePlatformAction = (principal, action) => {
  if (principal.twoFactorRequired) throw new TwoFactorRequiredError('Two-factor authentication is required for staff')
  const allowed = principal.platformRole ? PLATFORM_ROLE_ACTIONS[principal.platformRole] : []
  if (!allowed.includes(action)) throw new ForbiddenError(`Not allowed: ${action}`)
}
