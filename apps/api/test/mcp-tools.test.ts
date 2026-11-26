import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { UnauthenticatedError, type Principal } from '@saas/core'
import { createMcpServer, type ToolContext } from '../server/mcp/server.ts'
import { tenantMe } from '../server/utils/endpoints.ts'

const member: Principal = { kind: 'agent', id: 'u1', tenantId: 't1', role: 'profesional' }

async function connect(ctx: Partial<ToolContext> & { principal: ToolContext['principal'] }) {
  const tenants: string[] = []
  const server = createMcpServer({ tokenTenantId: 't1', setTenant: (t) => tenants.push(t), ...ctx })
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test', version: '0' })
  await Promise.all([server.connect(serverSide), client.connect(clientSide)])
  return { client, tenants }
}

const text = (r: unknown) => ((r as { content: { text: string }[] }).content[0]?.text ?? '')

test('every tool is read-only and listed', async () => {
  const { client } = await connect({ principal: async () => member })
  const { tools } = await client.listTools()
  assert.deepEqual(tools.map((t) => t.name).sort(), ['api_status', 'me', 'tenant_me'])
  for (const t of tools) assert.equal(t.annotations?.readOnlyHint, true, t.name)
})

test('tenant_me for a member: same tenant and role as the route, kind agent', async () => {
  const { client, tenants } = await connect({ principal: async () => member })
  const r = await client.callTool({ name: 'tenant_me', arguments: {} })
  assert.equal(r.isError, undefined)
  // Same function the HTTP route runs.
  assert.deepEqual(r.structuredContent, JSON.parse(JSON.stringify(tenantMe(member, 't1'))))
  assert.deepEqual(r.structuredContent, { tenantId: 't1', kind: 'agent', role: 'profesional' })
  assert.deepEqual(tenants, ['t1'])
})

test('tenant_me denials all look the same: foreign tenant, lost membership, no tenant claim', async () => {
  const foreign = await connect({ principal: async () => member })
  const lost = await connect({ principal: async () => ({ kind: 'agent', id: 'u1' }) })
  const noClaim = await connect({ tokenTenantId: undefined, principal: async () => ({ kind: 'agent', id: 'u1' }) })
  const results = [
    await foreign.client.callTool({ name: 'tenant_me', arguments: { tenantId: 't2' } }),
    await lost.client.callTool({ name: 'tenant_me', arguments: {} }),
    await noClaim.client.callTool({ name: 'tenant_me', arguments: {} }),
  ]
  for (const r of results) {
    assert.equal(r.isError, true)
    assert.equal(text(r), 'Forbidden')
    assert.equal(r.structuredContent, undefined)
  }
  // Denied attempts are still logged with the tenant they targeted.
  assert.deepEqual(foreign.tenants, ['t2'])
})

test('me returns the agent principal; unauthenticated callers get a generic error', async () => {
  const ok = await connect({ principal: async () => member })
  assert.deepEqual((await ok.client.callTool({ name: 'me', arguments: {} })).structuredContent, member)
  const anon = await connect({ principal: async () => { throw new UnauthenticatedError() } })
  const r = await anon.client.callTool({ name: 'me', arguments: {} })
  assert.equal(r.isError, true)
  assert.equal(text(r), 'Unauthorized')
})

test('api_status needs no tenant', async () => {
  const { client } = await connect({ tokenTenantId: undefined, principal: async () => ({ kind: 'agent', id: 'u1' }) })
  assert.deepEqual((await client.callTool({ name: 'api_status', arguments: {} })).structuredContent, { status: 'ok', service: 'saas-api' })
})
