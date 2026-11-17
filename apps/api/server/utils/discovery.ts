const DOCUMENTS = new Set(['oauth-authorization-server', 'openid-configuration'])
const ISSUER_PATH = 'api/auth'

/**
 * Maps the part after `/.well-known/` (RFC 8414: `<doc>[/<issuer-path>]`) to the path where
 * Better Auth serves it. Returns null for unknown documents or other issuer paths.
 */
export function discoveryTarget(path: string): string | null {
  const [doc, ...rest] = path.split('/').filter(Boolean)
  if (!doc || !DOCUMENTS.has(doc)) return null
  const suffix = rest.join('/')
  if (suffix && suffix !== ISSUER_PATH) return null
  return `/api/auth/.well-known/${doc}`
}
