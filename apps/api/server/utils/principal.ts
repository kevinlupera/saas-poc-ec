import { UnauthenticatedError } from '@saas/core'

/** Resolve the caller (session cookie or API key) or answer 401. Use inside handlers. */
export async function requirePrincipal(event: Parameters<typeof useContainer>[0]) {
  try {
    return await useContainer(event).authenticate(toWebRequest(event).headers)
  } catch (e) {
    if (e instanceof UnauthenticatedError) throw createError({ statusCode: 401, statusMessage: e.message })
    throw e
  }
}
