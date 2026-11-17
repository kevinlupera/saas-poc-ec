import { createMcpProtectedRequestHandler } from '@better-auth/mcp'

export interface McpAuthConfig {
  /** Authorization server issuer, e.g. http://localhost:3001/api/auth. JWKS lives at `<issuer>/jwks`. */
  authIssuer: string
  /** Canonical MCP resource URL; becomes the required token audience. */
  mcpResource: string
}

/** OAuth-protected MCP handler. Keep one instance so the verifier reuses its JWKS cache. */
export const createProtectedMcp = (
  { authIssuer, mcpResource }: McpAuthConfig,
  handler: Parameters<typeof createMcpProtectedRequestHandler>[1],
) => createMcpProtectedRequestHandler({ issuer: authIssuer, audience: mcpResource, jwksUrl: `${authIssuer}/jwks` }, handler)

/** RFC 9728: metadata is served at `/.well-known/oauth-protected-resource[/<resource-path>]`. */
export function isResourceMetadataPath(path: string, mcpResource: string): boolean {
  const suffix = path.split('/').filter(Boolean).join('/')
  const resourcePath = new URL(mcpResource).pathname.split('/').filter(Boolean).join('/')
  return suffix === '' || suffix === resourcePath
}
