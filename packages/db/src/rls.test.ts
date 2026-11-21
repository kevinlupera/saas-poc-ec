import assert from 'node:assert/strict'
import { test } from 'node:test'
import { tenantRlsSql } from './rls.ts'

test('generated SQL forces RLS and treats an empty tenant context as no tenant', () => {
  const sql = tenantRlsSql('services')
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/)
  assert.match(sql, /FORCE ROW LEVEL SECURITY/)
  assert.match(sql, /USING \(tenant_id = NULLIF\(current_setting\('app\.tenant_id', true\), ''\)\)/)
  assert.match(sql, /WITH CHECK \(tenant_id = NULLIF/)
})

test('table names that could inject SQL are rejected', () => {
  for (const bad of ['', 'Services', 'a b', 'a"; drop table x; --', '1abc', 'a-b']) {
    assert.throws(() => tenantRlsSql(bad), /Invalid table name/, bad)
  }
})
