import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requestLogLine } from '../server/utils/request-log.ts'

test('log line is one JSON object carrying tenantId', () => {
  const line = requestLogLine({ method: 'GET', path: '/api/tenants/t1/me', status: 200, durationMs: 4, tenantId: 't1', principalId: 'u1', principalKind: 'user' })
  assert.deepEqual(JSON.parse(line), {
    level: 'info', msg: 'request', method: 'GET', path: '/api/tenants/t1/me', status: 200, durationMs: 4,
    tenantId: 't1', principalId: 'u1', principalKind: 'user',
  })
  assert.equal(line.includes('\n'), false)
})

test('server errors log at error level, denied access stays info', () => {
  assert.equal(JSON.parse(requestLogLine({ method: 'GET', path: '/x', status: 500, durationMs: 1 })).level, 'error')
  assert.equal(JSON.parse(requestLogLine({ method: 'GET', path: '/x', status: 403, durationMs: 1, tenantId: 't2' })).level, 'info')
})

import { logRequestOnce } from '../server/utils/request-log.ts'

const make = (context: Record<string, unknown> = {}) => ({ method: 'GET', path: '/api/tenants/t1/me?token=SECRET', context })

test('logs once even if error and afterResponse both fire', () => {
  const lines: string[] = []
  const event = make({ tenantId: 't1' })
  logRequestOnce(event, 403, (l) => lines.push(l))
  logRequestOnce(event, 200, (l) => lines.push(l))
  assert.equal(lines.length, 1)
  assert.equal(JSON.parse(lines[0]!).status, 403)
})

test('a denied request keeps its tenantId and principal, and drops the query string', () => {
  const lines: string[] = []
  logRequestOnce(make({ tenantId: 't2', principalId: 'u1', principalKind: 'user', startedAt: Date.now() - 5 }), 403, (l) => lines.push(l))
  const row = JSON.parse(lines[0]!)
  assert.equal(row.tenantId, 't2')
  assert.equal(row.principalId, 'u1')
  assert.equal(row.path, '/api/tenants/t1/me')
  assert.ok(row.durationMs >= 5)
  assert.equal(lines[0]!.includes('SECRET'), false)
})

test('a request without startedAt logs a zero duration instead of NaN', () => {
  const lines: string[] = []
  logRequestOnce(make(), 401, (l) => lines.push(l))
  assert.equal(JSON.parse(lines[0]!).durationMs, 0)
})
