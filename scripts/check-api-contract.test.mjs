import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const script = join(dirname(fileURLToPath(import.meta.url)), 'check-api-contract.mjs')
const META = (id) =>
  `defineRouteMeta({ openAPI: { operationId: '${id}', tags: ['x'], description: 'd', responses: { 200: {} } } })`

function run(files, exemptions) {
  const root = mkdtempSync(join(tmpdir(), 'api-contract-'))
  try {
    for (const [rel, body] of Object.entries(files)) {
      mkdirSync(dirname(join(root, rel)), { recursive: true })
      writeFileSync(join(root, rel), body)
    }
    if (exemptions) {
      mkdirSync(join(root, 'scripts'), { recursive: true })
      writeFileSync(join(root, 'scripts/api-contract.exemptions.json'), JSON.stringify(exemptions))
    }
    const r = spawnSync(process.execPath, [script], { env: { ...process.env, API_CONTRACT_ROOT: root + '/' }, encoding: 'utf8' })
    return { code: r.status, out: r.stdout + r.stderr }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
const api = (n) => `apps/api/server/api/${n}`
const tool = (r) => `export const route = '${r}'`

test('passes when a route has meta and a tool', () => {
  const r = run({ [api('ping.get.ts')]: META('ping'), 'apps/api/server/mcp/tools/ping.ts': tool('GET /api/ping') })
  assert.equal(r.code, 0, r.out)
})
test('fails without defineRouteMeta', () => {
  const r = run({ [api('ping.get.ts')]: 'export default 1', 'apps/api/server/mcp/tools/ping.ts': tool('GET /api/ping') })
  assert.equal(r.code, 1)
  assert.match(r.out, /missing defineRouteMeta/)
})
test('fails without an MCP tool', () => {
  const r = run({ [api('ping.get.ts')]: META('ping') })
  assert.equal(r.code, 1)
  assert.match(r.out, /no MCP tool/)
})
test('fails on a route file without a method suffix', () => {
  const r = run({ [api('ping.ts')]: META('ping') })
  assert.equal(r.code, 1)
  assert.match(r.out, /name it <name>/)
})
test('fails on duplicate operationId with double quotes too', () => {
  const dq = META('dup').replace(/'dup'/, '"dup"')
  const r = run({
    [api('a.get.ts')]: META('dup'), [api('b.get.ts')]: dq,
    'apps/api/server/mcp/tools/a.ts': tool('GET /api/a'), 'apps/api/server/mcp/tools/b.ts': tool('GET /api/b'),
  })
  assert.equal(r.code, 1)
  assert.match(r.out, /operationId 'dup' already used/)
})
test('fails on a tool pointing at a missing route', () => {
  const r = run({ 'apps/api/server/mcp/tools/x.ts': tool('GET /api/ghost') })
  assert.equal(r.code, 1)
  assert.match(r.out, /does not exist/)
})
test('exemption works, needs a real reason, and goes stale once a tool exists', () => {
  const files = { [api('ping.get.ts')]: META('ping') }
  assert.equal(run(files, [{ route: 'GET /api/ping', reason: 'pending delegation model decision' }]).code, 0)
  const weak = run(files, [{ route: 'GET /api/ping', reason: 'todo' }])
  assert.equal(weak.code, 1)
  assert.match(weak.out, /real reason/)
  const stale = run({ ...files, 'apps/api/server/mcp/tools/ping.ts': tool('GET /api/ping') }, [{ route: 'GET /api/ping', reason: 'pending delegation model decision' }])
  assert.equal(stale.code, 1)
  assert.match(stale.out, /stale/)
})
