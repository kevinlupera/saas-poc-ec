import { UnauthenticatedError, type Principal } from '@saas/core'
import { agentPrincipal } from './agent-principal.ts'

type FindMemberRole = (userId: string, tenantId: string) => Promise<string | undefined>

/**
 * Principal for an MCP tool call, from the verified access-token claims.
 * `tenant_id` only says which tenant the user consented to; the role is read now,
 * so a revoked membership denies access even while the token is still valid.
 */
export async function mcpPrincipal(claims: Record<string, unknown>, findMemberRole: FindMemberRole): Promise<Principal> {
  const { sub, tenant_id: tenantId } = claims
  if (typeof sub !== 'string' || !sub) throw new UnauthenticatedError()
  if (typeof tenantId !== 'string' || !tenantId) return { kind: 'agent', id: sub }
  return agentPrincipal({ userId: sub, tenantId, memberRole: await findMemberRole(sub, tenantId) })
}
