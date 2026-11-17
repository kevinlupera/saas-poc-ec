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
