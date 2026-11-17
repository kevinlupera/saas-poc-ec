// Creates/updates the runtime role the app connects with: no superuser, no BYPASSRLS, DML only.
// Run with the OWNER connection (DATABASE_URL). Idempotent. Works on Neon (roles made with SQL
// have no BYPASSRLS; the console-created owner role does, so never run the app as the owner).
import pg from 'pg'

const owner = process.env.DATABASE_URL ?? 'postgres://saas:saas@localhost:5433/saas'
const password = process.env.APP_DB_PASSWORD ?? 'saas_app'

const client = new pg.Client({ connectionString: owner })
await client.connect()
try {
  const pw = client.escapeLiteral(password)
  await client.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'saas_app') THEN
      CREATE ROLE saas_app LOGIN PASSWORD ${pw};
    END IF;
  END $$`)
  await client.query(`ALTER ROLE saas_app LOGIN PASSWORD ${pw} NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE`)
  await client.query('GRANT USAGE ON SCHEMA public TO saas_app')
  await client.query('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO saas_app')
  await client.query('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO saas_app')
  await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO saas_app')
  await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO saas_app')
  console.log('saas_app role ready')
} finally {
  await client.end()
}
