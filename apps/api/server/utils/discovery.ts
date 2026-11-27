const DOCUMENTS = new Set(['oauth-authorization-server', 'openid-configuration'])
const ISSUER_PATH = 'api/auth'
const PROTECTED_RESOURCE = 'oauth-protected-resource'
/** Path of the MCP resource (`NITRO_MCP_RESOURCE` is validated to be `<API origin>/mcp`). */
const RESOURCE_PATH = 'mcp'

/**
 * Maps the part after `/.well-known/` to the path Better Auth answers it on, or null (404).
 * RFC 8414 documents (`<doc>[/<issuer-path>]`) live under the auth base path.
 * RFC 9728 resource metadata (`oauth-protected-resource[/<resource-path>]`) is answered by the MCP
 * plugin at the root path itself, so it passes through unchanged.
 */
export function discoveryTarget(path: string): string | null {
  const [doc, ...rest] = path.split('/').filter(Boolean)
  const suffix = rest.join('/')
  if (doc === PROTECTED_RESOURCE) {
    if (suffix && suffix !== RESOURCE_PATH) return null
    return `/.well-known/${PROTECTED_RESOURCE}${suffix ? `/${suffix}` : ''}`
  }
  if (!doc || !DOCUMENTS.has(doc)) return null
  if (suffix && suffix !== ISSUER_PATH) return null
  return `/api/auth/.well-known/${doc}`
}
