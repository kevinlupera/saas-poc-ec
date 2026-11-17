import assert from 'node:assert/strict'
import { test } from 'node:test'
import { consentTenant, tenantClaims } from '../src/adapters/tenant-claim.ts'

const member = async (userId: string, tenantId: string) => (userId === 'u1' && tenantId === 't1' ? 'owner' : null)

test('member of the consented tenant: token carries tenant_id', async () => {
  assert.deepEqual(await tenantClaims(member, { user: { id: 'u1' }, referenceId: 't1' }), { tenant_id: 't1' })
})
test('user no longer a member: no tenant_id (also on refresh, which re-runs the claims)', async () => {
  assert.deepEqual(await tenantClaims(member, { user: { id: 'u1' }, referenceId: 't2' }), {})
})
test('no user or no consent reference: no tenant_id', async () => {
  assert.deepEqual(await tenantClaims(member, { user: null, referenceId: 't1' }), {})
  assert.deepEqual(await tenantClaims(member, { user: { id: 'u1' } }), {})
})
test('consent reference is the session active tenant, undefined when there is none', () => {
  assert.equal(consentTenant({ activeOrganizationId: 't1' }), 't1')
  assert.equal(consentTenant({ activeOrganizationId: null }), undefined)
  assert.equal(consentTenant({}), undefined)
})
