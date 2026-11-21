import { defineNitroConfig } from 'nitropack/config'

// MCP server (POST /mcp). How tools access data is still undecided:
// HTTP to apps/api or shared packages (db + core). See README.
export default defineNitroConfig({
  compatibilityDate: '2025-07-15',
  preset: 'aws_lambda',
  srcDir: 'server',
  runtimeConfig: {
    // apps/api URL (used by the example tool). Override with NITRO_API_BASE.
    apiBase: 'http://localhost:3001',
    // OAuth: tokens are issued by apps/api (Better Auth mcp plugin) and verified against its JWKS.
    // Override with NITRO_AUTH_ISSUER, NITRO_MCP_RESOURCE.
    authIssuer: 'http://localhost:3001/api/auth',
    mcpResource: 'http://localhost:3002/mcp',
  },
})
