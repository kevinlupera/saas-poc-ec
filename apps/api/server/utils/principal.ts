import { UnauthenticatedError } from '@saas/core'
import { createError } from 'h3'
import { getContainer } from './container'

/** Resolve the caller (session cookie or API key) or answer 401. */
export async function requirePrincipal(headers: Headers, rawConfig: unknown) {
  try {
    return await getContainer(rawConfig).authenticate(headers)
  } catch (e) {
    if (e instanceof UnauthenticatedError) throw createError({ statusCode: 401, statusMessage: e.message })
    throw e
  }
}
