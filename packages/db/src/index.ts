import { and, eq } from 'drizzle-orm'
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

/** Role of `userId` in tenant (organization) `tenantId`, or undefined when not a member. */
export async function findMemberRole(db: Db, userId: string, tenantId: string): Promise<string | undefined> {
  const [row] = await db
    .select({ role: schema.member.role })
    .from(schema.member)
    .where(and(eq(schema.member.userId, userId), eq(schema.member.organizationId, tenantId)))
    .limit(1)
  return row?.role
}

/** First tenant (organization) the user belongs to; used as the default active tenant at sign-in. */
export async function findFirstTenantId(db: Db, userId: string): Promise<string | undefined> {
  const [row] = await db
    .select({ id: schema.member.organizationId })
    .from(schema.member)
    .where(eq(schema.member.userId, userId))
    .orderBy(schema.member.createdAt)
    .limit(1)
  return row?.id
}
