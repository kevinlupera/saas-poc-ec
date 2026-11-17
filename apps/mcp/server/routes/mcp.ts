import { createMcpProtectedRequestHandler } from '@better-auth/mcp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/cfworker'
import { registerApiStatus } from '../tools/api-status'

/**
 * MCP endpoint (Streamable HTTP, stateless): POST /mcp.
 * Protected by OAuth: bearer JWTs issued by apps/api. Unauthenticated calls get the
 * RFC 9728 `WWW-Authenticate` challenge. Each request creates its own server + transport.
 */
export default defineEventHandler((event) => {
  const { apiBase, authIssuer, mcpResource } = useRuntimeConfig(event)

  const handler = createMcpProtectedRequestHandler(
    { issuer: authIssuer, audience: mcpResource, jwksUrl: `${authIssuer}/jwks` },
    async (request) => {
      const server = new McpServer(
        { name: 'saas-mcp', version: '0.1.0' },
        // Portable, `eval`-free JSON Schema validator.
        { jsonSchemaValidator: new CfWorkerJsonSchemaValidator() },
      )
      registerApiStatus(server, apiBase)

      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless
        enableJsonResponse: true,
      })
      await server.connect(transport)
      return transport.handleRequest(request)
    },
  )
  return handler(toWebRequest(event))
})
