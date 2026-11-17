import { asRole, type Principal } from '@saas/core'

/** An agent acts for the user who approved it, with that user's role, only where they are a member. */
export function agentPrincipal(input: { userId: string; tenantId: string; memberRole: string | undefined }): Principal {
  const role = asRole(input.memberRole)
  // Not a member (or unknown role): no tenant, so every authorization fails.
  return role
    ? { kind: 'agent', id: input.userId, tenantId: input.tenantId, role }
    : { kind: 'agent', id: input.userId }
}
