// Only used by `pnpm auth:schema` so the Better Auth CLI can read the plugin list.
import { createAuth } from './auth.ts'

export const auth = createAuth({
  db: {} as never,
  secret: 'cli-only-secret-cli-only-secret-123',
  baseURL: 'http://localhost:3001',
  trustedOrigins: [],
  mcpResource: 'https://localhost/mcp',
})
