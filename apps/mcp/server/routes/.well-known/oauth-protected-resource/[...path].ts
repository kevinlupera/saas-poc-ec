import { isResourceMetadataPath } from '../../../utils/protected-mcp'

/** RFC 9728 protected resource metadata, so MCP clients can discover the authorization server. */
export default defineEventHandler((event) => {
  const { authIssuer, mcpResource } = useRuntimeConfig(event)
  if (!isResourceMetadataPath(getRouterParam(event, 'path') ?? '', mcpResource)) {
    throw createError({ statusCode: 404 })
  }
  return {
    resource: mcpResource,
    authorization_servers: [authIssuer],
    bearer_methods_supported: ['header'],
  }
})
