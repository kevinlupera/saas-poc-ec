import { defineNitroConfig } from 'nitropack/config'

// MCP server (POST /mcp). How tools access data is still undecided:
// HTTP to apps/api or shared packages (db + core). See README.
export default defineNitroConfig({
  compatibilityDate: '2025-07-15',
  preset: 'cloudflare_module',
  srcDir: 'server',
  runtimeConfig: {
    // apps/api URL (used by the example tool). Override with NITRO_API_BASE.
    apiBase: 'http://localhost:3001',
    // If set, requires `Authorization: Bearer <token>`. Override with NITRO_MCP_TOKEN.
    mcpToken: '',
  },
})
