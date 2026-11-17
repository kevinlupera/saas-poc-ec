import type { Principal } from './principal.ts'

/** Internal staff of the platform itself (not tenant members). See docs SA-18. */
export const PLATFORM_ROLES = ['superadmin', 'soporte', 'finanzas'] as const
export type PlatformRole = (typeof PLATFORM_ROLES)[number]

export const PLATFORM_ACTIONS = [
  'platform:tenants:read',
  'platform:staff:manage',
  'platform:payments:read',
  /** Full payment data. Soporte never gets it. */
  'platform:payments:read-full',
] as const
export type PlatformAction = (typeof PLATFORM_ACTIONS)[number]

export const PLATFORM_ROLE_ACTIONS: Record<PlatformRole, readonly PlatformAction[]> = {
  superadmin: PLATFORM_ACTIONS,
  soporte: ['platform:tenants:read', 'platform:payments:read'],
  finanzas: ['platform:tenants:read', 'platform:payments:read', 'platform:payments:read-full'],
}

export interface PlatformAccess {
  platformRole?: PlatformRole
  /** Staff without a verified second factor: no platform access until they enroll. */
  twoFactorRequired?: boolean
}

/**
 * Staff role comes from `user.role`, which may hold several roles separated by commas.
 * Precedence is fixed so the result never depends on the order they were stored in.
 */
export function resolvePlatformAccess(user: { role?: unknown; twoFactorEnabled?: unknown }): PlatformAccess {
  const held = typeof user.role === 'string' ? user.role.split(',').map((r) => r.trim()) : []
  const platformRole = PLATFORM_ROLES.find((r) => held.includes(r))
  if (!platformRole) return {}
  // 2FA is mandatory for staff. Enabled means the second factor was verified at least once.
  return user.twoFactorEnabled === true ? { platformRole } : { twoFactorRequired: true }
}

export type PaymentVisibility = 'none' | 'masked' | 'full'

/** What a principal may see of payment data. Payment endpoints must use this to decide masking. */
export function paymentVisibility(principal: Principal): PaymentVisibility {
  const actions = principal.platformRole ? PLATFORM_ROLE_ACTIONS[principal.platformRole] : []
  if (actions.includes('platform:payments:read-full')) return 'full'
  return actions.includes('platform:payments:read') ? 'masked' : 'none'
}
