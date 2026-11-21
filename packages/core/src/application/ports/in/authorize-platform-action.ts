import type { PlatformAction } from '../../../domain/platform.ts'
import type { Principal } from '../../../domain/principal.ts'

/** Driving port for platform (staff) actions. Rejects with `TwoFactorRequiredError` or `ForbiddenError`. */
export type AuthorizePlatformAction = (principal: Principal, action: PlatformAction) => void
