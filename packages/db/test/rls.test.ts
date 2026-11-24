// Integration test: needs the local Postgres (`docker compose up -d`, `pnpm --filter @saas/db db:migrate`,
// `pnpm --filter @saas/db db:app-role`). Run with `pnpm test:db`.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { sql } from 'drizzle-orm'
import pg from 'pg'
import { createDb, tenantRlsSql, withTenant } from '../src/index.ts'

const AUTH_TABLES = new Set([
  'account',
  'agent',
  'agent_capability_grant',
  'agent_host',
  'apikey',
  'approval_request',
  'invitation',
  'jwks',
  'member',
  'oauth_access_token',
  'oauth_client',
  'oauth_client_assertion',
  'oauth_client_resource',
  'oauth_consent',
  'oauth_refresh_token',
  'oauth_resource',
  'organization',
  'session',
  'user',
  'verification',
])

const OWNER_URL = process.env.DATABASE_URL ?? 'postgres://saas:saas@localhost:5433/saas'
const APP_URL = process.env.APP_DATABASE_URL ?? 'postgres://saas_app:saas_app@localhost:5433/saas'

const owner = new pg.Client({ connectionString: OWNER_URL })
const app = createDb(APP_URL)

before(async () => {
  await owner.connect()
  await owner.query('DROP TABLE IF EXISTS rls_probe')
  await owner.query('CREATE TABLE rls_probe (id serial PRIMARY KEY, tenant_id text NOT NULL, secret text NOT NULL)')
  await owner.query(tenantRlsSql('rls_probe'))
  await owner.query('GRANT SELECT, INSERT, UPDATE, DELETE ON rls_probe TO saas_app')
  await owner.query('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO saas_app')
  await withTenant(app, 'tenant-a', (tx) => tx.execute(sql`insert into rls_probe (tenant_id, secret) values ('tenant-a', 'a-secret')`))
  await withTenant(app, 'tenant-b', (tx) => tx.execute(sql`insert into rls_probe (tenant_id, secret) values ('tenant-b', 'b-secret')`))
})

after(async () => {
  await owner.query('DROP TABLE IF EXISTS rls_probe')
  await owner.end()
  await app.$client.end()
})

const secrets = (tenant: string) =>
  withTenant(app, tenant, async (tx) => (await tx.execute(sql`select secret from rls_probe order by id`)).rows.map((r) => r.secret))

test('the app role cannot bypass RLS', async () => {
  const { rows } = await owner.query("select rolsuper, rolbypassrls from pg_roles where rolname = 'saas_app'")
  assert.deepEqual(rows[0], { rolsuper: false, rolbypassrls: false })
})

test('a tenant reads only its own rows', async () => {
  assert.deepEqual(await secrets('tenant-a'), ['a-secret'])
  assert.deepEqual(await secrets('tenant-b'), ['b-secret'])
})

test('cross-tenant read fails: an unknown tenant sees nothing', async () => {
  assert.deepEqual(await secrets('tenant-c'), [])
})

test('no tenant context fails closed: zero rows, not all rows', async () => {
  const { rows } = await app.execute(sql`select secret from rls_probe`)
  assert.equal(rows.length, 0)
})

test('tenant context does not leak to the next transaction on the same connection', async () => {
  await secrets('tenant-a')
  const { rows } = await app.execute(sql`select secret from rls_probe`)
  assert.equal(rows.length, 0)
})

test('rows with an empty tenant_id are never visible, even after a tenant context ran on the connection', async () => {
  // Postgres reports '' (not NULL) for a custom setting once it was set in an earlier transaction.
  await owner.query("insert into rls_probe (tenant_id, secret) values ('', 'empty-tenant-secret')")
  try {
    await secrets('tenant-a') // sets app.tenant_id locally; pool max is 1, so the same connection is reused
    const { rows } = await app.execute(sql`select secret from rls_probe`)
    assert.equal(rows.length, 0)
    assert.deepEqual(await secrets('tenant-a'), ['a-secret'])
  } finally {
    await owner.query("delete from rls_probe where tenant_id = ''")
  }
})

test('a tenant cannot write rows for another tenant', async () => {
  await assert.rejects(
    withTenant(app, 'tenant-a', (tx) => tx.execute(sql`insert into rls_probe (tenant_id, secret) values ('tenant-b', 'planted')`)),
  )
})

test('a tenant cannot update or delete another tenant rows', async () => {
  const upd = await withTenant(app, 'tenant-a', (tx) => tx.execute(sql`update rls_probe set secret = 'pwned' where tenant_id = 'tenant-b'`))
  const del = await withTenant(app, 'tenant-a', (tx) => tx.execute(sql`delete from rls_probe where tenant_id = 'tenant-b'`))
  assert.equal(upd.rowCount, 0)
  assert.equal(del.rowCount, 0)
  assert.deepEqual(await secrets('tenant-b'), ['b-secret'])
})

test('withTenant rejects an empty tenant', async () => {
  await assert.rejects(withTenant(app, '', async () => 1), /tenantId/)
})

test('every business table has tenant_id and forced RLS', async () => {
  const { rows } = await owner.query(`
    select c.relname as name, c.relforcerowsecurity as forced,
           exists (select 1 from information_schema.columns
                   where table_schema = 'public' and table_name = c.relname and column_name = 'tenant_id') as has_tenant_id
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'`)
  const business = rows.filter((r) => !AUTH_TABLES.has(r.name) && r.name !== 'rls_probe')
  const bad = business.filter((r) => !r.has_tenant_id || !r.forced).map((r) => r.name)
  assert.deepEqual(bad, [], `business tables missing tenant_id or FORCE RLS: ${bad.join(', ')}`)
})

test('every business table has the current tenant_isolation policy (not one from an older helper)', async () => {
  const { rows } = await owner.query(
    "select tablename, qual, with_check from pg_policies where schemaname = 'public' and policyname = 'tenant_isolation'",
  )
  const byTable = new Map(rows.map((r) => [r.tablename, r]))
  const { rows: tables } = await owner.query("select tablename from pg_tables where schemaname = 'public'")
  const stale = tables
    .map((t) => t.tablename as string)
    .filter((name) => !AUTH_TABLES.has(name) && name !== 'rls_probe')
    .filter((name) => !/NULLIF/.test(byTable.get(name)?.qual ?? '') || !/NULLIF/.test(byTable.get(name)?.with_check ?? ''))
  assert.deepEqual(stale, [], `outdated or missing tenant_isolation policy; re-run tenantRlsSql in a new migration: ${stale.join(', ')}`)
})
