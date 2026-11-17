import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema.ts'

/** One connection per Lambda container; put RDS Proxy / a pooler in front in production. */
export function createDb(url: string) {
  const pool = new pg.Pool({ connectionString: url, max: 1 })
  return drizzle(pool, { schema })
}

export type Db = ReturnType<typeof createDb>
export { schema }
