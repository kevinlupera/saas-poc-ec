import { agentAuth } from '@better-auth/agent-auth'
import { apiKey } from '@better-auth/api-key'
import { cimd } from '@better-auth/cimd'
import { fetchClientMetadataResource } from '@better-auth/cimd/node'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { i18n, locales } from '@better-auth/i18n'
import { mcp } from '@better-auth/mcp'
import { authorizeAction } from '@saas/core'
import { findFirstTenantId, findMemberRole, type Db } from '@saas/db'
import { betterAuth } from 'better-auth'
import { admin, jwt, openAPI, organization } from 'better-auth/plugins'
import { agentPrincipal } from './adapters/agent-principal.ts'
import { consentTenant, tenantClaims } from './adapters/tenant-claim.ts'
import { createAccessControl } from 'better-auth/plugins/access'
import { adminAc, defaultStatements, ownerAc } from 'better-auth/plugins/organization/access'

export interface AuthConfig {
  db: Db
  secret: string
  /** Public URL of the API, e.g. https://api.example.com */
  baseURL: string
  /** Browser origin(s) allowed to call the auth endpoints. */
  trustedOrigins: string[]
  /** Origin of the web app that hosts the /sign-in and /consent pages. */
  webOrigin: string
  /** Canonical HTTPS URL of the MCP resource, must match what apps/mcp serves. */
  mcpResource: string
}

const API_KEY_ALL = ['create', 'read', 'update', 'delete'] as const
const ac = createAccessControl({ ...defaultStatements, apiKey: API_KEY_ALL })
// Roles from docs/historias-de-usuario-2.md NA-13. Fine-grained rules live in @saas/core.
// Only owner and admin manage the tenant's API keys.
const roles = {
  owner: ac.newRole({ ...ownerAc.statements, apiKey: API_KEY_ALL }),
  admin: ac.newRole({ ...adminAc.statements, apiKey: API_KEY_ALL }),
  recepcion: ac.newRole({ member: [], invitation: [] }),
  profesional: ac.newRole({ member: [], invitation: [] }),
}

export const API_KEY_CONFIG = 'org-keys'

export function createAuth(config: AuthConfig) {
  return betterAuth({
    database: drizzleAdapter(config.db, { provider: 'pg' }),
    secret: config.secret,
    baseURL: config.baseURL,
    trustedOrigins: config.trustedOrigins,
    emailAndPassword: { enabled: true },
    databaseHooks: {
      session: {
        create: {
          // Every session starts in the user's first tenant, so a tenant is active before any client code runs.
          before: async (session) => ({
            data: { ...session, activeOrganizationId: await findFirstTenantId(config.db, session.userId) },
          }),
        },
      },
    },
    plugins: [
      jwt(),
      organization({ ac, roles }),
      admin(),
      // Keys belong to a tenant (organization); their scopes live in `permissions.saas`.
      apiKey([{ configId: API_KEY_CONFIG, defaultPrefix: 'org_', references: 'organization' }]),
      agentAuth({
        providerName: 'SaaS',
        providerDescription: 'Scheduling APIs for AI agents.',
        modes: ['delegated'],
        capabilities: [
          {
            name: 'whoami',
            description: 'Return the agent identity inside one tenant (organization).',
            input: { type: 'object', properties: { tenantId: { type: 'string' } }, required: ['tenantId'] },
          },
        ],
        async onExecute({ capability, arguments: args, agentSession }) {
          if (capability !== 'whoami') throw new Error(`Unsupported capability: ${capability}`)
          const tenantId = typeof args?.tenantId === 'string' ? args.tenantId : undefined
          if (!tenantId) throw new Error('tenantId is required')
          // The agent acts for the user who approved it, only in tenants where that user is a member.
          const memberRole = await findMemberRole(config.db, agentSession.user.id, tenantId)
          const principal = agentPrincipal({ userId: agentSession.user.id, tenantId, memberRole })
          authorizeAction(principal, 'agenda:own', tenantId)
          return { tenantId, role: principal.role }
        },
      }),
      mcp({
        loginPage: `${config.webOrigin}/sign-in`,
        consentPage: `${config.webOrigin}/consent`,
        resource: config.mcpResource,
        // The consent is tied to the session's active tenant, so tokens say which tenant they act in.
        // No picker yet (shouldRedirect: false): a user in several tenants authorizes the active one.
        postLogin: {
          page: `${config.webOrigin}/select-tenant`,
          shouldRedirect: () => false,
          consentReferenceId: ({ session }) => consentTenant(session as { activeOrganizationId?: string | null }),
        },
        // `tenant_id` reflects membership at issue/refresh time only; consumers must re-authorize.
        customAccessTokenClaims: (info) => tenantClaims((userId, tenantId) => findMemberRole(config.db, userId, tenantId), info),
      }),
      cimd({ fetchClientMetadataResource, metadataProfile: 'mcp-2026-07-28' }),
      i18n({ translations: locales }),
      openAPI(),
    ],
  })
}

export type Auth = ReturnType<typeof createAuth>
