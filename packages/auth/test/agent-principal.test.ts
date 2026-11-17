import assert from 'node:assert/strict'
import { test } from 'node:test'
import { agentPrincipal } from '../src/adapters/agent-principal.ts'

test('member: agent inherits the user role in that tenant', () => {
  assert.deepEqual(agentPrincipal({ userId: 'u1', tenantId: 't1', memberRole: 'recepcion' }), {
    kind: 'agent',
    id: 'u1',
    tenantId: 't1',
    role: 'recepcion',
  })
})

test('non-member or unknown role: no tenant and no role', () => {
  assert.deepEqual(agentPrincipal({ userId: 'u1', tenantId: 't1', memberRole: undefined }), { kind: 'agent', id: 'u1' })
  assert.deepEqual(agentPrincipal({ userId: 'u1', tenantId: 't1', memberRole: 'member' }), { kind: 'agent', id: 'u1' })
})
