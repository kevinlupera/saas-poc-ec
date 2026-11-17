import { asRole, scopesFromPermissions, type IdentityProvider, type Principal } from '@saas/core'
import { API_KEY_CONFIG, type Auth } from '../auth.ts'

/** API key permissions may come back as an object or as the stored JSON string. */
function parsePermissions(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

/** Maps Better Auth sessions (cookie / bearer) and tenant API keys to the core `Principal`. */
export function betterAuthIdentity(auth: Auth): IdentityProvider {
  return {
    async resolve(headers: Headers): Promise<Principal | null> {
      const session = await auth.api.getSession({ headers })
      if (session) {
        const tenantId = (session.session as { activeOrganizationId?: string | null }).activeOrganizationId ?? undefined
        const member = tenantId ? await auth.api.getActiveMember({ headers }).catch(() => null) : null
        const role = asRole(member?.role)
        // The role only counts if it belongs to the same tenant the session points at.
        return { kind: 'user', id: session.user.id, tenantId: role ? tenantId : undefined, role }
      }
      const key = headers.get('x-api-key')
      if (key) {
        const result = await auth.api.verifyApiKey({ body: { key, configId: API_KEY_CONFIG } }).catch(() => null)
        if (result?.valid && result.key) {
          return {
            kind: 'apiKey',
            id: result.key.id,
            tenantId: result.key.referenceId,
            scopes: scopesFromPermissions(parsePermissions(result.key.permissions)),
          }
        }
      }
      return null
    },
  }
}
