import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema.ts'

/** Small pool: serverless instances multiply it. Point the URL at Neon's pooled (`-pooler`) host. */
export function createDb(url: string) {
  const pool = new pg.Pool({ connectionString: url, max: 1 })
  return drizzle(pool, { schema })
}

export type Db = ReturnType<typeof createDb>
export { schema }
