import assert from 'node:assert/strict'
import { test } from 'node:test'
import { discoveryTarget } from '../server/utils/discovery.ts'

test('maps known documents, with or without the issuer path', () => {
  const want = '/api/auth/.well-known/oauth-authorization-server'
  assert.equal(discoveryTarget('oauth-authorization-server'), want)
  assert.equal(discoveryTarget('oauth-authorization-server/api/auth'), want)
  assert.equal(discoveryTarget('openid-configuration/'), '/api/auth/.well-known/openid-configuration')
})

test('rejects unknown documents and foreign issuer paths', () => {
  assert.equal(discoveryTarget(''), null)
  assert.equal(discoveryTarget('nope'), null)
  assert.equal(discoveryTarget('oauth-authorization-server/other/tenant'), null)
})

test('protected resource metadata (RFC 9728) is passed through at the root path the MCP plugin serves', () => {
  assert.equal(discoveryTarget('oauth-protected-resource'), '/.well-known/oauth-protected-resource')
  assert.equal(discoveryTarget('oauth-protected-resource/mcp'), '/.well-known/oauth-protected-resource/mcp')
  assert.equal(discoveryTarget('oauth-protected-resource/other'), null)
  assert.equal(discoveryTarget('oauth-protected-resource/api/auth'), null)
})
