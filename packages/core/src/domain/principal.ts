import type { PlatformRole } from './platform.ts'
import type { Action, Role } from './role.ts'

/** Who is calling, independent of how they authenticated. */
export interface Principal {
  kind: 'user' | 'apiKey' | 'agent'
  id: string
  /** The tenant (organization) this principal acts in. Everything is scoped to it. */
  tenantId?: string
  /** Member role in the tenant (users and agents acting for a user). */
  role?: Role
  /** Explicit grants, used by API keys (no role). Never widen beyond what the key holds. */
  scopes?: readonly Action[]
  /** Platform staff role. Only set when the staff member has a verified second factor. */
  platformRole?: PlatformRole
  /** Staff that must enroll in 2FA before any platform access. */
  twoFactorRequired?: boolean
}
