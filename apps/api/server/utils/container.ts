// Composition root: the only place that knows core, auth and db together.
// Config arrives as `unknown` (Nitro runtimeConfig) and is validated here, so this file
// has no Nitro auto-imports and typechecks the same from api, mcp and web.
import { betterAuthIdentity, createAuth } from '@saas/auth'
import { authorizeAction, makeAuthenticateRequest } from '@saas/core'
import { createDb } from '@saas/db'
import { z } from 'zod'

const ConfigSchema = z.object({
  authSecret: z.string().min(32, 'NITRO_AUTH_SECRET must be at least 32 chars'),
  databaseUrl: z.string().min(1),
  authBaseUrl: z.url(),
  webOrigin: z.string().min(1),
  mcpResource: z.url(),
})

/** Validates runtime config. Error names the offending keys only, never their values. */
export function parseConfig(rawConfig: unknown) {
  const result = ConfigSchema.safeParse(rawConfig)
  if (result.success) return result.data
  const keys = [...new Set(result.error.issues.map((i) => i.path.join('.')))].join(', ')
  throw new Error(`Invalid server configuration: ${keys}`)
}

let cached: ReturnType<typeof build> | undefined

function build(rawConfig: unknown) {
  const cfg = parseConfig(rawConfig)
  const auth = createAuth({
    db: createDb(cfg.databaseUrl),
    secret: cfg.authSecret,
    baseURL: cfg.authBaseUrl,
    trustedOrigins: [cfg.webOrigin],
    webOrigin: cfg.webOrigin,
    mcpResource: cfg.mcpResource,
  })
  return { auth, authenticate: makeAuthenticateRequest(betterAuthIdentity(auth)), authorize: authorizeAction }
}

/** Built once per Lambda container. */
export const getContainer = (rawConfig: unknown) => (cached ??= build(rawConfig))
