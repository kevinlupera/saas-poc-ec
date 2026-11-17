import { agentAuth } from '@better-auth/agent-auth'
import { apiKey } from '@better-auth/api-key'
import { cimd } from '@better-auth/cimd'
import { fetchClientMetadataResource } from '@better-auth/cimd/node'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { i18n, locales } from '@better-auth/i18n'
import { mcp } from '@better-auth/mcp'
import type { Db } from '@saas/db'
import { betterAuth } from 'better-auth'
import { admin, jwt, openAPI, organization } from 'better-auth/plugins'
import { createAccessControl } from 'better-auth/plugins/access'
import { adminAc, defaultStatements, ownerAc } from 'better-auth/plugins/organization/access'

export interface AuthConfig {
  db: Db
  secret: string
  /** Public URL of the API, e.g. https://api.example.com */
  baseURL: string
  /** Browser origin(s) allowed to call the auth endpoints. */
  trustedOrigins: string[]
  /** Canonical HTTPS URL of the MCP resource, must match what apps/mcp serves. */
  mcpResource: string
}

const ac = createAccessControl(defaultStatements)
// Roles from docs/historias-de-usuario-2.md NA-13. Fine-grained rules live in @saas/core.
const roles = {
  owner: ac.newRole(ownerAc.statements),
  admin: ac.newRole(adminAc.statements),
  recepcion: ac.newRole({ member: [], invitation: [] }),
  profesional: ac.newRole({ member: [], invitation: [] }),
}

export function createAuth(config: AuthConfig) {
  return betterAuth({
    database: drizzleAdapter(config.db, { provider: 'pg' }),
    secret: config.secret,
    baseURL: config.baseURL,
    trustedOrigins: config.trustedOrigins,
    emailAndPassword: { enabled: true },
    plugins: [
      jwt(),
      organization({ ac, roles }),
      admin(),
      apiKey(),
      agentAuth({
        providerName: 'SaaS',
        providerDescription: 'Scheduling APIs for AI agents.',
        modes: ['delegated'],
        capabilities: [{ name: 'whoami', description: 'Return the authenticated user id.' }],
        async onExecute({ capability, agentSession }) {
          if (capability === 'whoami') return { userId: agentSession.user.id }
          throw new Error(`Unsupported capability: ${capability}`)
        },
      }),
      mcp({ loginPage: '/sign-in', consentPage: '/consent', resource: config.mcpResource }),
      cimd({ fetchClientMetadataResource, metadataProfile: 'mcp-2026-07-28' }),
      i18n({ translations: locales }),
      openAPI(),
    ],
  })
}

export type Auth = ReturnType<typeof createAuth>
