export const ROLES = ['owner', 'admin', 'recepcion', 'profesional'] as const
export type Role = (typeof ROLES)[number]

export const ACTIONS = [
  'business:settings',
  'business:revenue',
  'members:invite',
  'apikeys:manage',
  'agenda:all',
  'agenda:own',
] as const
export type Action = (typeof ACTIONS)[number]

/** Role → allowed actions (see docs/historias-de-usuario-2.md NA-13). */
export const ROLE_ACTIONS: Record<Role, readonly Action[]> = {
  owner: ACTIONS,
  admin: ACTIONS,
  recepcion: ['agenda:all', 'agenda:own'],
  profesional: ['agenda:own'],
}

/** What an API key may hold. Keys can never manage keys (no privilege amplification). */
export const GRANTABLE_SCOPES: readonly Action[] = ACTIONS.filter((a) => a !== 'apikeys:manage')

/** Resource name under which API keys store their scopes: `permissions: { saas: ['agenda:own'] }`. */
export const SCOPE_RESOURCE = 'saas'

/** Reads scopes from an API key's `permissions`. Unknown or malformed entries are dropped. */
export function scopesFromPermissions(permissions: unknown): Action[] {
  const raw = (permissions as Record<string, unknown> | null | undefined)?.[SCOPE_RESOURCE]
  if (!Array.isArray(raw)) return []
  return raw.filter((v): v is Action => (GRANTABLE_SCOPES as readonly unknown[]).includes(v))
}

export const asRole = (value: unknown): Role | undefined =>
  (ROLES as readonly unknown[]).includes(value) ? (value as Role) : undefined
