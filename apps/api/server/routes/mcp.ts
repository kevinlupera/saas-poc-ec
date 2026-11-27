import { requireMcpAuth } from '@better-auth/mcp'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createMcpServer } from '../mcp/server.ts'
import { getContainer } from '../utils/container'

/**
 * MCP endpoint (Streamable HTTP, stateless): POST /mcp on the API origin.
 * Bearer access tokens issued by this API's OAuth server, audience = NITRO_MCP_RESOURCE, verified
 * in-process. Anything else gets 401 with the RFC 9728 `WWW-Authenticate` challenge.
 * Tools run in-process with an agent principal built from the claims; the token is never forwarded.
 */
export default defineEventHandler((event) => {
  const container = getContainer(useRuntimeConfig(event))
  const { cfg } = container
  // requireMcpAuth resolves its verifier per call, so wrapping per request costs nothing
  // and lets the tools write to this request's event.
  const handler = requireMcpAuth(
    container.auth,
    async (request, claims) => {
      event.context.principalId = claims.sub
      event.context.principalKind = 'agent'
      let principal: ReturnType<typeof container.authenticateMcp> | undefined
      const server = createMcpServer({
        // Resolved once per request, only when a tool needs it (one membership lookup).
        principal: () => (principal ??= container.authenticateMcp(claims)),
        tokenTenantId: typeof claims.tenant_id === 'string' ? claims.tenant_id : undefined,
        setTenant: (tenantId) => {
          event.context.tenantId = tenantId
        },
      })
      const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
      await server.connect(transport)
      return transport.handleRequest(request)
    },
    { resource: cfg.mcpResource, issuer: `${cfg.authBaseUrl.replace(/\/+$/, '')}/api/auth` },
  )
  return handler(toWebRequest(event))
})
