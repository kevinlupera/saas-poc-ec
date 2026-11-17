import type { IdentityProvider, Principal, Role } from '@saas/core'
import { ROLES } from '@saas/core'
import type { Auth } from '../auth.ts'

const asRole = (value: unknown): Role | undefined =>
  typeof value === 'string' && (ROLES as readonly string[]).includes(value) ? (value as Role) : undefined

/** Maps Better Auth sessions (cookie / bearer) and API keys to the core `Principal`. */
export function betterAuthIdentity(auth: Auth): IdentityProvider {
  return {
    async resolve(headers: Headers): Promise<Principal | null> {
      const session = await auth.api.getSession({ headers })
      if (session) {
        const orgId = (session.session as { activeOrganizationId?: string | null }).activeOrganizationId ?? undefined
        let role: Role | undefined
        if (orgId) {
          const member = await auth.api.getActiveMember({ headers }).catch(() => null)
          role = asRole(member?.role)
        }
        return { kind: 'user', id: session.user.id, organizationId: orgId, role }
      }
      const key = headers.get('x-api-key')
      if (key) {
        const result = await auth.api.verifyApiKey({ body: { key } }).catch(() => null)
        if (result?.valid && result.key) return { kind: 'apiKey', id: result.key.id, organizationId: undefined }
      }
      return null
    },
  }
}
