import { requireMcpAuth } from '@better-auth/mcp'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createMcpServer } from '../mcp/server'
import { getContainer } from '../utils/container'

/**
 * MCP endpoint (Streamable HTTP, stateless): POST /mcp on the API origin.
 * Bearer access tokens issued by this API's OAuth server, audience = NITRO_MCP_RESOURCE, verified
 * in-process. Anything else gets 401 with the RFC 9728 `WWW-Authenticate` challenge.
 * Tools run in-process and never forward the token.
 */
export default defineEventHandler((event) => {
  const { auth, cfg } = getContainer(useRuntimeConfig(event))
  // requireMcpAuth resolves its verifier per call, so wrapping per request costs nothing
  // and lets the tools see this request's event.
  const handler = requireMcpAuth(
    auth,
    async (request) => {
      const server = createMcpServer()
      const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
      await server.connect(transport)
      return transport.handleRequest(request)
    },
    { resource: cfg.mcpResource, issuer: `${cfg.authBaseUrl.replace(/\/+$/, '')}/api/auth` },
  )
  return handler(toWebRequest(event))
})
