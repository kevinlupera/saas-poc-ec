import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MAX_REDIRECT_URIS, registrationProblem } from '../src/adapters/client-registration.ts'

const ok = { client_name: 'MCP Inspector', redirect_uris: ['http://localhost:6274/oauth/callback'], token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] }

test('accepts what MCP clients send: https and loopback http on any port', () => {
  assert.equal(registrationProblem(ok), undefined)
  for (const uri of ['https://claude.ai/api/mcp/auth_callback', 'http://127.0.0.1:53682/callback', 'http://[::1]:9/cb'])
    assert.equal(registrationProblem({ ...ok, redirect_uris: [uri] }), undefined, uri)
  assert.equal(registrationProblem({ ...ok, client_uri: 'https://github.com/modelcontextprotocol/inspector', require_pkce: true }), undefined)
})

test('rejects remote http, odd schemes, wildcards and too many redirect URIs', () => {
  for (const uri of ['http://evil.example/cb', 'http://localhost.evil.example/cb', 'javascript:alert(1)', 'myapp://cb', 'https://*.example.com/cb', 'not a url'])
    assert.equal(registrationProblem({ ...ok, redirect_uris: [uri] })?.error, 'invalid_redirect_uri', uri)
  const many = Array.from({ length: MAX_REDIRECT_URIS + 1 }, (_, i) => `https://a.example/${i}`)
  assert.match(registrationProblem({ ...ok, redirect_uris: many })?.description ?? '', /at most/)
})

test('rejects unknown fields, opting out of PKCE, long names and non-https display URLs', () => {
  const problem = (body: unknown) => registrationProblem(body)?.description ?? ''
  assert.match(problem({ ...ok, skip_consent: true }), /unsupported client metadata: skip_consent/)
  assert.match(problem({ ...ok, require_pkce: false }), /pkce/)
  assert.match(problem({ ...ok, client_name: 'x'.repeat(101) }), /client_name/)
  assert.match(problem({ ...ok, logo_uri: 'http://evil.example/logo.png' }), /logo_uri/)
  assert.match(problem({ ...ok, client_uri: 'javascript:alert(1)' }), /client_uri/)
  assert.equal(registrationProblem([ok])?.error, 'invalid_client_metadata')
})
