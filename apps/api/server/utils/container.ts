// Composition root: the only place that knows core, auth and db together.
import { makeAuthenticateRequest } from '@saas/core'
import { betterAuthIdentity, createAuth } from '@saas/auth'
import { createDb } from '@saas/db'

let cached: ReturnType<typeof build> | undefined

function build(event: Parameters<typeof useRuntimeConfig>[0]) {
  const cfg = useRuntimeConfig(event)
  if (!cfg.authSecret) throw new Error('NITRO_AUTH_SECRET is required')
  const auth = createAuth({
    db: createDb(cfg.databaseUrl),
    secret: cfg.authSecret,
    baseURL: cfg.authBaseUrl,
    trustedOrigins: [cfg.webOrigin],
    mcpResource: cfg.mcpResource,
  })
  return { auth, authenticate: makeAuthenticateRequest(betterAuthIdentity(auth)) }
}

/** Lazily built once per Lambda container. */
export const useContainer = (event: Parameters<typeof useRuntimeConfig>[0]) => (cached ??= build(event))
