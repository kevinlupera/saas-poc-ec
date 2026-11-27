// Deletes dynamically registered OAuth clients that never got a token, 30 days after registration.
// Run periodically: `pnpm --filter @saas/db db:cleanup-dcr` (NITRO_DATABASE_URL, the runtime role, is enough).
import { createDb } from './index.ts'
import { deleteUnusedDynamicClients } from './oauth-clients.ts'

const DAYS = 30
const db = createDb(process.env.NITRO_DATABASE_URL ?? 'postgres://saas_app:saas_app@localhost:5433/saas')
try {
  const deleted = await deleteUnusedDynamicClients(db, new Date(Date.now() - DAYS * 86_400_000))
  console.log(JSON.stringify({ level: 'info', msg: 'unused dynamic oauth clients deleted', count: deleted.length, clientIds: deleted }))
} finally {
  await db.$client.end()
}
