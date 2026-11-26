import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/cfworker'
import * as apiStatus from './tools/api-status'

/** One MCP server per request (stateless transport). Every tool in ./tools is registered here. */
export function createMcpServer() {
  // Portable, `eval`-free JSON Schema validator.
  const server = new McpServer({ name: 'saas-api', version: '0.1.0' }, { jsonSchemaValidator: new CfWorkerJsonSchemaValidator() })
  apiStatus.register(server)
  return server
}
