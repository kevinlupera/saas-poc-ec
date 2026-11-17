// OAuth access tokens for MCP clients are bound to one tenant (organization).
// The consent is stored per tenant (consentReferenceId) and the token says which one via `tenant_id`.
// The claim reflects membership when the token is issued or refreshed, not afterwards:
// consumers must still authorize every action against current membership (authorizeAction).

type FindMemberRole = (userId: string, tenantId: string) => Promise<unknown>

/** The consent reference for an OAuth authorization: the session's active tenant, if any. */
export function consentTenant(session: { activeOrganizationId?: string | null }): string | undefined {
  return session.activeOrganizationId ?? undefined
}

/** Extra access-token claims: `tenant_id` only while the user is a member of the consented tenant. */
export async function tenantClaims(
  findMemberRole: FindMemberRole,
  info: { user?: { id: string } | null; referenceId?: string },
): Promise<{ tenant_id?: string }> {
  const { user, referenceId } = info
  if (!user || !referenceId) return {}
  return (await findMemberRole(user.id, referenceId)) ? { tenant_id: referenceId } : {}
}
