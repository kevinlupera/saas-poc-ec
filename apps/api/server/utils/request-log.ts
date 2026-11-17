export interface RequestLog {
  method: string
  /** Pathname only: query strings can carry tokens. */
  path: string
  status: number
  durationMs: number
  /** Tenant the request targeted (also set on denied cross-tenant attempts). */
  tenantId?: string
  principalId?: string
  principalKind?: string
}

/** One JSON object per line, so any log pipeline can filter by `tenantId`. */
export const requestLogLine = (entry: RequestLog): string =>
  JSON.stringify({ level: entry.status >= 500 ? 'error' : 'info', msg: 'request', ...entry })

/** The slice of an H3 event the logger needs (kept structural so this file has no framework import). */
export interface LoggableEvent {
  method: string
  path: string
  context: Record<string, unknown>
}

/**
 * Log a request once. Nitro can report the same request twice (error + afterResponse), and thrown
 * errors (401, 403, 500...) skip `afterResponse`, so callers hook both and rely on this guard.
 */
export function logRequestOnce(event: LoggableEvent, status: number, sink: (line: string) => void = console.log) {
  if (event.context.logged) return
  event.context.logged = true
  const { tenantId, principalId, principalKind, startedAt } = event.context as Record<string, string | number | undefined>
  sink(
    requestLogLine({
      method: event.method,
      path: event.path.split('?')[0] ?? event.path,
      status,
      durationMs: typeof startedAt === 'number' ? Date.now() - startedAt : 0,
      tenantId: tenantId as string | undefined,
      principalId: principalId as string | undefined,
      principalKind: principalKind as string | undefined,
    }),
  )
}
