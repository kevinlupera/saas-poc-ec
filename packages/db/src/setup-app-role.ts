// Creates/updates the runtime role the app connects with: no superuser, no BYPASSRLS, DML only.
// Run with the OWNER connection (DATABASE_URL) and an explicit APP_DB_PASSWORD (there is no default:
// a known password on an internet-reachable database is a hole). Re-running it rotates the password
// to APP_DB_PASSWORD, so keep it in your secret store. Works on Neon: the console owner role is not
// a real superuser, so the role attributes are set at CREATE time and then *verified*, never ALTERed.
import pg from 'pg'

const owner = process.env.DATABASE_URL ?? 'postgres://saas:saas@localhost:5433/saas'
const password = process.env.APP_DB_PASSWORD
if (!password) {
  console.error('APP_DB_PASSWORD is required (local dev: APP_DB_PASSWORD=saas_app pnpm --filter @saas/db db:app-role)')
  process.exit(1)
}

const client = new pg.Client({ connectionString: owner })
await client.connect()
try {
  const pw = client.escapeLiteral(password)
  await client.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'saas_app') THEN
      CREATE ROLE saas_app LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD ${pw};
    ELSE
      ALTER ROLE saas_app PASSWORD ${pw};
    END IF;
  END $$`)

  // Fail closed on a pre-existing role too: it must have exactly the least-privilege attributes.
  // (They are verified, not ALTERed: a non-superuser owner such as Neon's cannot change some of them.)
  const { rows } = await client.query(
    "SELECT rolsuper, rolbypassrls, rolcreatedb, rolcreaterole, rolcanlogin FROM pg_roles WHERE rolname = 'saas_app'",
  )
  const r = rows[0]
  if (r?.rolsuper || r?.rolbypassrls || r?.rolcreatedb || r?.rolcreaterole || !r?.rolcanlogin) {
    throw new Error(
      `saas_app has unexpected attributes (${JSON.stringify(r)}); it must be LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE. Drop and recreate it: DROP OWNED BY saas_app; DROP ROLE saas_app;`,
    )
  }

  await client.query('GRANT USAGE ON SCHEMA public TO saas_app')
  await client.query('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO saas_app')
  await client.query('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO saas_app')
  await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO saas_app')
  await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO saas_app')
  console.log('saas_app role ready')
} finally {
  await client.end()
}
