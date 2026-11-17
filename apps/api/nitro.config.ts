import { defineNitroConfig } from 'nitropack/config'

export default defineNitroConfig({
  compatibilityDate: '2025-07-15',
  preset: 'aws_lambda',
  srcDir: 'server',
  runtimeConfig: {
    // Origin allowed by CORS. Override with NITRO_WEB_ORIGIN.
    webOrigin: 'http://localhost:3000',
    // Auth. Override with NITRO_AUTH_SECRET, NITRO_DATABASE_URL, NITRO_AUTH_BASE_URL, NITRO_MCP_RESOURCE.
    authSecret: '',
    // Runtime role `saas_app` (no BYPASSRLS), never the owner. Migrations use DATABASE_URL (owner).
    databaseUrl: 'postgres://saas_app:saas_app@localhost:5433/saas',
    authBaseUrl: 'http://localhost:3001',
    mcpResource: 'http://localhost:3002/mcp',
  },
})
