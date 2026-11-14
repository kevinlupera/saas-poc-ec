import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/cfworker'
import { registerApiStatus } from '../tools/api-status'

/**
 * MCP endpoint (Streamable HTTP, stateless): POST /mcp.
 * Each request creates its own server + transport → works the same on Workers or Lambda.
 */
export default defineEventHandler(async (event) => {
  const { apiBase, mcpToken } = useRuntimeConfig(event)

  if (mcpToken && getHeader(event, 'authorization') !== `Bearer ${mcpToken}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const server = new McpServer(
    { name: 'saas-mcp', version: '0.1.0' },
    // `eval`-free validator: required on Cloudflare Workers.
    { jsonSchemaValidator: new CfWorkerJsonSchemaValidator() },
  )
  registerApiStatus(server, apiBase)

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  })
  await server.connect(transport)
  return transport.handleRequest(toWebRequest(event))
})
