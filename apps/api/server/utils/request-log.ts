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
