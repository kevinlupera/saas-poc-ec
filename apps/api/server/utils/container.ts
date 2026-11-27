// Composition root: the only place that knows core, auth and db together.
// Config arrives as `unknown` (Nitro runtimeConfig) and is validated here, so this file
// has no Nitro auto-imports and typechecks the same from api and web.
import { betterAuthIdentity, createAuth, mcpPrincipal, resendSender, smtpSender } from '@saas/auth'
import { authorizeAction, makeAuthenticateRequest } from '@saas/core'
import { createDb, findMemberRole } from '@saas/db'
import { z } from 'zod'

const ConfigSchema = z.object({
  authSecret: z.string().min(32, 'NITRO_AUTH_SECRET must be at least 32 chars'),
  databaseUrl: z.string().min(1),
  authBaseUrl: z.url(),
  webOrigin: z.string().min(1),
  mcpResource: z.url(),
  resendApiKey: z.string().default(''),
  emailFrom: z.string().default(''),
  smtpHost: z.string().min(1).default('localhost'),
  smtpPort: z.coerce.number().int().positive().default(1025),
  googleClientId: z.string().default(''),
  googleClientSecret: z.string().default(''),
  // NITRO_OAUTH_DCR_ENABLED: 'true' / 'false'; unset = on outside production only.
  oauthDcrEnabled: z.union([z.boolean(), z.enum(['true', 'false', '']).transform((v) => (v === '' ? undefined : v === 'true'))]).optional(),
})

type Env = { production: boolean }

/** Cross-field rules. Issues carry key names only, never values. */
const rules = (env: Env) => (cfg: z.infer<typeof ConfigSchema>, ctx: z.RefinementCtx) => {
  const missing = (key: string) => ctx.addIssue({ code: 'custom', path: [key], message: 'required' })
  // Production never falls back to local SMTP.
  if (env.production && !cfg.resendApiKey) missing('resendApiKey')
  if ((env.production || cfg.resendApiKey) && !cfg.emailFrom) missing('emailFrom')
  if (cfg.googleClientId && !cfg.googleClientSecret) missing('googleClientSecret')
  if (cfg.googleClientSecret && !cfg.googleClientId) missing('googleClientId')
  // MCP is served by this API at `/mcp`, so the resource URL (token audience) must be exactly that.
  if (cfg.mcpResource !== new URL('/mcp', cfg.authBaseUrl).href) {
    ctx.addIssue({ code: 'custom', path: ['mcpResource'], message: 'must be <API origin>/mcp' })
  }
}

const resolve = (env: Env) => ({ resendApiKey, emailFrom, smtpHost, smtpPort, googleClientId, googleClientSecret, oauthDcrEnabled, ...cfg }: z.infer<typeof ConfigSchema>) => ({
  ...cfg,
  // Open client registration: anyone can create an OAuth client, so production needs an explicit opt-in.
  oauthDcrEnabled: oauthDcrEnabled ?? !env.production,
  production: env.production,
  mail: resendApiKey
    ? { kind: 'resend' as const, apiKey: resendApiKey, from: emailFrom }
    : { kind: 'smtp' as const, host: smtpHost, port: smtpPort, from: emailFrom || 'no-reply@localhost' },
  google: googleClientId ? { clientId: googleClientId, clientSecret: googleClientSecret } : undefined,
})

/** Validates runtime config. Error names the offending keys only, never their values. */
export function parseConfig(rawConfig: unknown, env: Env = { production: process.env.NODE_ENV === 'production' }) {
  const result = ConfigSchema.superRefine(rules(env)).transform(resolve(env)).safeParse(rawConfig)
  if (result.success) return result.data
  const keys = [...new Set(result.error.issues.map((i) => i.path.join('.')))].join(', ')
  throw new Error(`Invalid server configuration: ${keys}`)
}

let cached: ReturnType<typeof build> | undefined

function build(rawConfig: unknown) {
  const cfg = parseConfig(rawConfig)
  const db = createDb(cfg.databaseUrl)
  const auth = createAuth({
    db,
    secret: cfg.authSecret,
    baseURL: cfg.authBaseUrl,
    trustedOrigins: [cfg.webOrigin],
    webOrigin: cfg.webOrigin,
    mcpResource: cfg.mcpResource,
    google: cfg.google,
    dynamicClientRegistration: cfg.oauthDcrEnabled,
    relaxedAuthRateLimits: !cfg.production,
    sendEmail: cfg.mail.kind === 'resend' ? resendSender(cfg.mail) : smtpSender(cfg.mail),
  })
  return {
    cfg,
    auth,
    authenticate: makeAuthenticateRequest(betterAuthIdentity(auth)),
    /** MCP tool caller, from verified access-token claims plus current membership. */
    authenticateMcp: (claims: Record<string, unknown>) => mcpPrincipal(claims, (userId, tenantId) => findMemberRole(db, userId, tenantId)),
    authorize: authorizeAction,
  }
}

/** Built once per Lambda container. */
export const getContainer = (rawConfig: unknown) => (cached ??= build(rawConfig))
