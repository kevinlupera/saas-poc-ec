import { getContainer } from '../../utils/container'
import { discoveryTarget } from '../../utils/discovery'

// RFC 8414 puts discovery metadata at the host root; Better Auth serves it under its base path.
export default defineEventHandler((event) => {
  assertMethod(event, ['GET', 'HEAD'])
  const target = discoveryTarget(getRouterParam(event, 'path') ?? '')
  if (!target) throw createError({ statusCode: 404 })
  const url = new URL(toWebRequest(event).url)
  url.pathname = target
  return getContainer(useRuntimeConfig(event)).auth.handler(new Request(url, { method: event.method, headers: event.headers }))
})
