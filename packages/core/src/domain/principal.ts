import type { Role } from './role.ts'

/** Who is calling, independent of how they authenticated. */
export interface Principal {
  kind: 'user' | 'apiKey' | 'agent'
  id: string
  organizationId?: string
  role?: Role
}
