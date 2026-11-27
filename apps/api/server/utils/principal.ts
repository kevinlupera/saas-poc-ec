import { ForbiddenError, UnauthenticatedError, type Action, type Principal } from '@saas/core'
import { createError, type H3Event } from 'h3'
import { getContainer } from './container'

/** Maps core errors to HTTP. Anything else is a real failure and keeps bubbling up. */
function toHttp(e: unknown): never {
  if (e instanceof UnauthenticatedError) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (e instanceof ForbiddenError) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  throw e
}

/** Resolve the caller (session cookie or tenant API key) or answer 401. */
export async function requirePrincipal(event: H3Event, rawConfig: unknown) {
  try {
    const principal = await getContainer(rawConfig).authenticate(event.headers)
    event.context.principalId = principal.id
    event.context.principalKind = principal.kind
    return principal
  } catch (e) {
    return toHttp(e)
  }
}

/** Runs endpoint logic and maps core errors to HTTP (401/403). */
export function asHttp<T>(run: () => T): T {
  try {
    return run()
  } catch (e) {
    return toHttp(e)
  }
}

/** Authorize an already authenticated principal for `action` inside `tenantId`, or answer 403. */
export function assertAllowed(rawConfig: unknown, principal: Principal, action: Action, tenantId: string) {
  try {
    getContainer(rawConfig).authorize(principal, action, tenantId)
  } catch (e) {
    toHttp(e)
  }
}

/** Authenticate and authorize `action` inside `tenantId`: 401 without identity, 403 otherwise. */
export async function requireAccess(event: H3Event, rawConfig: unknown, action: Action, tenantId: string) {
  // Logged even when access is denied, so cross-tenant attempts are visible.
  event.context.tenantId = tenantId
  const principal = await requirePrincipal(event, rawConfig)
  assertAllowed(rawConfig, principal, action, tenantId)
  return principal
}
