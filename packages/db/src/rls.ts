const TABLE = /^[a-z_][a-z0-9_]*$/

/**
 * SQL that makes `table` tenant-isolated. Put it in the migration that creates a business table
 * (which must have a `tenant_id text not null` column). FORCE applies the policy to the table
 * owner too; the app role must also be NOSUPERUSER NOBYPASSRLS (see `db:app-role`).
 * `current_setting(..., true)` is NULL when no tenant is set, so the policy fails closed.
 */
export function tenantRlsSql(table: string): string {
  if (!TABLE.test(table)) throw new Error(`Invalid table name: ${table}`)
  return [
    `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`,
    `CREATE POLICY tenant_isolation ON "${table}"`,
    `  USING (tenant_id = current_setting('app.tenant_id', true))`,
    `  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));`,
  ].join('\n')
}
