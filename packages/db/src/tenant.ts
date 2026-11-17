import { sql } from 'drizzle-orm'
import type { Db } from './index.ts'

export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

/**
 * The only way to touch tenant data. Runs `fn` in a transaction whose RLS context is `tenantId`
 * (`set_config(..., true)` is transaction-local, so it never leaks to the next request on the
 * same pooled connection). Without this context every RLS policy sees NULL and returns no rows.
 */
export async function withTenant<T>(db: Db, tenantId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (!tenantId) throw new Error('withTenant requires a tenantId')
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`)
    return fn(tx)
  })
}
