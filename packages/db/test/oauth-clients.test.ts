// Integration test: needs the local Postgres (see rls.test.ts). Run with `pnpm test:db`.
import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import pg from 'pg'
import { createDb } from '../src/index.ts'
import { deleteUnusedDynamicClients } from '../src/oauth-clients.ts'

const APP_URL = process.env.APP_DATABASE_URL ?? 'postgres://saas_app:saas_app@localhost:5433/saas'
const db = createDb(APP_URL)
const client = new pg.Client({ connectionString: APP_URL })
const run = `t${Date.now()}`
const old = new Date(Date.now() - 31 * 86_400_000)

async function insertClient(name: string, createdAt: Date, extra: { reference_id?: string; client_discovery_id?: string } = {}) {
  const id = `${run}-${name}`
  await client.query(
    'INSERT INTO oauth_client (id, client_id, redirect_uris, created_at, reference_id, client_discovery_id) VALUES ($1, $1, $2, $3, $4, $5)',
    [id, ['http://localhost/cb'], createdAt, extra.reference_id ?? null, extra.client_discovery_id ?? null],
  )
  return id
}

after(async () => {
  await client.query('DELETE FROM oauth_client WHERE client_id LIKE $1', [`${run}-%`])
  await client.end()
  await db.$client.end()
})

test('deletes only old dynamically registered clients that never got a token', async () => {
  await client.connect()
  const unused = await insertClient('unused', old)
  const recent = await insertClient('recent', new Date())
  const owned = await insertClient('owned', old, { reference_id: 'tenant' })
  const cimd = await insertClient('cimd', old, { client_discovery_id: 'cimd' })
  const used = await insertClient('used', old)
  await client.query("INSERT INTO oauth_access_token (id, token, client_id, expires_at, created_at, scopes) VALUES ($1, $1, $2, now(), now(), '{openid}')", [`${run}-tok`, used])

  const deleted = await deleteUnusedDynamicClients(db, new Date(Date.now() - 30 * 86_400_000))

  assert.deepEqual(deleted.filter((id) => id.startsWith(run)), [unused])
  const { rows } = await client.query('SELECT client_id FROM oauth_client WHERE client_id LIKE $1 ORDER BY client_id', [`${run}-%`])
  assert.deepEqual(rows.map((r) => r.client_id), [cimd, owned, recent, used].sort())
})
