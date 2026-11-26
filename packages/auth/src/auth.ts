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
import type { EmailMessage, SendEmail } from './adapters/email.ts'
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
  /** Origin of the web app that hosts the /login and /consent pages. */
  webOrigin: string
  /** Canonical URL of the MCP resource (`<API origin>/mcp`, served by apps/api); the token audience. */
  mcpResource: string
  /** Delivers verification emails (Resend in production, Mailpit SMTP locally). */
  sendEmail: SendEmail
  /** Google sign-in; omitted = disabled. Server-only credentials. */
  google?: { clientId: string; clientSecret: string }
}

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Verification link pointing back to the web. Sign-in sends no callbackURL, and Better Auth then uses "/" on the API origin. */
export function verificationLink(url: string, webOrigin: string) {
  const link = new URL(url)
  const callback = link.searchParams.get('callbackURL')
  if (!callback || callback === '/') link.searchParams.set('callbackURL', new URL('/verificar-email', webOrigin).href)
  return link.href
}

export function verificationEmail(to: string, link: string) {
  return {
    to,
    subject: 'Verifica tu email en CitasSaaS',
    text: `Confirma tu email para activar tu cuenta de CitasSaaS:\n\n${link}\n\nSi no creaste esta cuenta, ignora este mensaje.`,
    html: `<p>Confirma tu email para activar tu cuenta de CitasSaaS.</p><p><a href="${escapeHtml(link)}">Verificar mi email</a></p><p>Si no creaste esta cuenta, ignora este mensaje.</p>`,
  }
}

/** Sent instead of a verification email when someone signs up with an address that already has an account. */
export function existingAccountEmail(to: string, webOrigin: string) {
  const link = `${webOrigin}/login`
  return {
    to,
    subject: 'Ya tienes una cuenta en CitasSaaS',
    text: `Alguien intentó crear una cuenta de CitasSaaS con este email, pero ya tienes una. Inicia sesión aquí:\n\n${link}\n\nSi no fuiste tú, ignora este mensaje.`,
    html: `<p>Alguien intentó crear una cuenta de CitasSaaS con este email, pero ya tienes una.</p><p><a href="${escapeHtml(link)}">Iniciar sesión</a></p><p>Si no fuiste tú, ignora este mensaje.</p>`,
  }
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
  // Awaited: Lambda freezes once the response is sent, so a detached send can be lost.
  // A failed send is logged, not thrown, so the response never reveals whether mail went out.
  // Log the failure kind only: never the URL, token or recipient.
  const send = (message: EmailMessage) =>
    config.sendEmail(message).catch((error: unknown) => {
      console.error(JSON.stringify({ level: 'error', msg: 'email failed', subject: message.subject, error: error instanceof Error ? error.name : 'unknown' }))
    })
  return betterAuth({
    database: drizzleAdapter(config.db, { provider: 'pg' }),
    secret: config.secret,
    baseURL: config.baseURL,
    trustedOrigins: config.trustedOrigins,
    // Unverified accounts get no session: sign-up and sign-in send a verification email instead.
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      // Account enumeration: a new sign-up waits for its verification email, so a sign-up with an
      // existing address waits for one email too and both take the same time.
      onExistingUserSignUp: ({ user }) => send(existingAccountEmail(user.email, config.webOrigin)),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: ({ user, url }) => send(verificationEmail(user.email, verificationLink(url, config.webOrigin))),
    },
    socialProviders: config.google ? { google: config.google } : {},
    account: {
      // Security rule (Better Auth default, pinned): Google never links to an account whose email is unverified,
      // so whoever pre-registered an address cannot share the real owner's account. Verified accounts link.
      accountLinking: { requireLocalEmailVerified: true },
    },
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
