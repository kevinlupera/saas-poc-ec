import { logRequestOnce } from '../utils/request-log'

// Structured access log. `tenantId` / principal are put on `event.context` by requireAccess.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    event.context.startedAt = Date.now()
  })
  // Thrown errors skip `afterResponse`; they are the requests that matter most here (denied access).
  nitroApp.hooks.hook('error', (error, ctx) => {
    if (ctx?.event) logRequestOnce(ctx.event, (error as { statusCode?: number }).statusCode ?? 500)
  })
  nitroApp.hooks.hook('afterResponse', (event) => logRequestOnce(event, getResponseStatus(event)))
})
