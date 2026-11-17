const TABLE = /^[a-z_][a-z0-9_]*$/

/**
 * SQL that makes `table` tenant-isolated. Put it in the migration that creates a business table
 * (which must have a `tenant_id text not null` column). FORCE applies the policy to the table
 * owner too; the app role must also be NOSUPERUSER NOBYPASSRLS (see `db:app-role`).
 * `NULLIF(current_setting(..., true), '')` matters: outside `withTenant` the setting is NULL on a
 * fresh connection but '' on a connection that already ran a tenant transaction. Both must match
 * nothing, otherwise rows with tenant_id = '' would be readable.
 */
export function tenantRlsSql(table: string): string {
  if (!TABLE.test(table)) throw new Error(`Invalid table name: ${table}`)
  return [
    `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`,
    // Idempotent: a later migration can re-run this to upgrade policies created by an older version.
    `DROP POLICY IF EXISTS tenant_isolation ON "${table}";`,
    `CREATE POLICY tenant_isolation ON "${table}"`,
    `  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))`,
    `  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));`,
  ].join('\n')
}
