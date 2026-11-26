import assert from 'node:assert/strict'
import { test } from 'node:test'
import { UnauthenticatedError } from '@saas/core'
import { mcpPrincipal } from '../src/adapters/mcp-principal.ts'

const roles = (table: Record<string, string>) => {
  const calls: string[] = []
  const find = async (userId: string, tenantId: string) => {
    calls.push(`${userId}@${tenantId}`)
    return table[`${userId}@${tenantId}`]
  }
  return { calls, find }
}

test('member of the token tenant: agent with the current role there', async () => {
  const { calls, find } = roles({ 'u1@t1': 'profesional' })
  assert.deepEqual(await mcpPrincipal({ sub: 'u1', tenant_id: 't1' }, find), {
    kind: 'agent', id: 'u1', tenantId: 't1', role: 'profesional',
  })
  // Membership is read when the tool runs, not trusted from the token.
  assert.deepEqual(calls, ['u1@t1'])
})

test('token tenant but no current membership: agent without tenant', async () => {
  const { find } = roles({})
  assert.deepEqual(await mcpPrincipal({ sub: 'u1', tenant_id: 't1' }, find), { kind: 'agent', id: 'u1' })
})

test('no tenant claim: agent without tenant, no lookup', async () => {
  const { calls, find } = roles({ 'u1@t1': 'owner' })
  assert.deepEqual(await mcpPrincipal({ sub: 'u1' }, find), { kind: 'agent', id: 'u1' })
  assert.deepEqual(await mcpPrincipal({ sub: 'u1', tenant_id: 42 }, find), { kind: 'agent', id: 'u1' })
  assert.deepEqual(calls, [])
})

test('missing or non-string subject: unauthenticated', async () => {
  const { find } = roles({})
  await assert.rejects(mcpPrincipal({}, find), UnauthenticatedError)
  await assert.rejects(mcpPrincipal({ sub: '' }, find), UnauthenticatedError)
  await assert.rejects(mcpPrincipal({ sub: 7 }, find), UnauthenticatedError)
})
