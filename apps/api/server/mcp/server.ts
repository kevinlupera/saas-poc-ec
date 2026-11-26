import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/cfworker'
import { ForbiddenError, UnauthenticatedError, type Principal } from '@saas/core'
import * as apiStatus from './tools/api-status.ts'
import * as me from './tools/me.ts'
import * as tenantMe from './tools/tenant-me.ts'

/** What a tool knows about the current MCP request. Built by routes/mcp.ts from the verified token. */
export interface ToolContext {
  /** The caller: an agent acting for the token subject, with their current role. Never the token itself. */
  principal: () => Promise<Principal>
  /** Tenant the user consented to (`tenant_id` claim), used when a tool gets no explicit tenant. */
  tokenTenantId?: string
  /** Records the tenant an action targets, for the request log (denied attempts included). */
  setTenant: (tenantId: string) => void
}

/** Successful result: the value as text and as structured content. */
export function ok(value: object): CallToolResult {
  const text = JSON.stringify(value)
  // Parsed back so structured content is exactly what goes on the wire (no `undefined` keys).
  return { content: [{ type: 'text', text }], structuredContent: JSON.parse(text) as Record<string, unknown> }
}

/**
 * Runs a tool body and turns core auth errors into one generic tool error each, like the HTTP 401/403:
 * wrong tenant, lost membership and missing permission all read `Forbidden`.
 */
export async function guarded(run: () => Promise<CallToolResult>): Promise<CallToolResult> {
  try {
    return await run()
  } catch (e) {
    if (e instanceof UnauthenticatedError) return { isError: true, content: [{ type: 'text', text: 'Unauthorized' }] }
    if (e instanceof ForbiddenError) return { isError: true, content: [{ type: 'text', text: 'Forbidden' }] }
    throw e
  }
}

/** One MCP server per request (stateless transport). Every tool in ./tools is registered here. */
export function createMcpServer(ctx: ToolContext) {
  // Portable, `eval`-free JSON Schema validator.
  const server = new McpServer({ name: 'saas-api', version: '0.1.0' }, { jsonSchemaValidator: new CfWorkerJsonSchemaValidator() })
  apiStatus.register(server)
  me.register(server, ctx)
  tenantMe.register(server, ctx)
  return server
}
