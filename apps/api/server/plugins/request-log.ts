import type { H3Event } from 'h3'
import { requestLogLine } from '../utils/request-log'

// Structured access log. `tenantId` / principal are put on `event.context` by requireAccess.
export default defineNitroPlugin((nitroApp) => {
  const log = (event: H3Event, status: number) => {
    // Nitro can report the same request twice (error + afterResponse): log it once.
    if (event.context.logged) return
    event.context.logged = true
    const { tenantId, principalId, principalKind, startedAt } = event.context
    console.log(
      requestLogLine({
        method: event.method,
        path: event.path.split('?')[0] ?? event.path,
        status,
        durationMs: Date.now() - (typeof startedAt === 'number' ? startedAt : Date.now()),
        tenantId,
        principalId,
        principalKind,
      }),
    )
  }

  nitroApp.hooks.hook('request', (event) => {
    event.context.startedAt = Date.now()
  })
  // Thrown errors (401, 403, 500...) skip `afterResponse`; they are the requests that matter most here.
  nitroApp.hooks.hook('error', (error, ctx) => {
    if (ctx?.event) log(ctx.event, (error as { statusCode?: number }).statusCode ?? 500)
  })
  nitroApp.hooks.hook('afterResponse', (event) => log(event, getResponseStatus(event)))
})
