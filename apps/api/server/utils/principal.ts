import { ForbiddenError, UnauthenticatedError, type Action, type Principal } from '@saas/core'
import { createError } from 'h3'
import { getContainer } from './container'

/** Maps core errors to HTTP. Anything else is a real failure and keeps bubbling up. */
function toHttp(e: unknown): never {
  if (e instanceof UnauthenticatedError) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (e instanceof ForbiddenError) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  throw e
}

/** Resolve the caller (session cookie or tenant API key) or answer 401. */
export async function requirePrincipal(headers: Headers, rawConfig: unknown) {
  try {
    return await getContainer(rawConfig).authenticate(headers)
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
export async function requireAccess(headers: Headers, rawConfig: unknown, action: Action, tenantId: string) {
  const principal = await requirePrincipal(headers, rawConfig)
  assertAllowed(rawConfig, principal, action, tenantId)
  return principal
}
