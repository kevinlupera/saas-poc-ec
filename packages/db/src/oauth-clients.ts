import { sql } from 'drizzle-orm'
import type { Db } from './index.ts'

/**
 * Deletes OAuth clients created by open dynamic registration (no owner user, no reference, not a
 * CIMD document) before `createdBefore` that never got a token. JWT access tokens are not stored,
 * but every token needs a consent first (DCR clients cannot skip it), so "no consent and no stored
 * token" means the client never got one. Returns the deleted client ids.
 */
export async function deleteUnusedDynamicClients(db: Db, createdBefore: Date): Promise<string[]> {
  const { rows } = await db.execute<{ client_id: string }>(sql`
    DELETE FROM oauth_client c
    WHERE c.user_id IS NULL AND c.reference_id IS NULL AND c.client_discovery_id IS NULL
      AND c.created_at < ${createdBefore.toISOString()}
      AND NOT EXISTS (SELECT 1 FROM oauth_consent x WHERE x.client_id = c.client_id)
      AND NOT EXISTS (SELECT 1 FROM oauth_refresh_token x WHERE x.client_id = c.client_id)
      AND NOT EXISTS (SELECT 1 FROM oauth_access_token x WHERE x.client_id = c.client_id)
    RETURNING c.client_id`)
  return rows.map((r) => r.client_id)
}
