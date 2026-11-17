export const ROLES = ['owner', 'admin', 'recepcion', 'profesional'] as const
export type Role = (typeof ROLES)[number]

export const ACTIONS = [
  'business:settings',
  'business:revenue',
  'members:invite',
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
