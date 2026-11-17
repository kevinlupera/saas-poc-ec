import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { after, before, test } from 'node:test'
import { SignJWT, exportJWK, generateKeyPair } from 'jose'
import { createProtectedMcp, isResourceMetadataPath } from '../server/utils/protected-mcp.ts'

const RESOURCE = 'https://mcp.example.com/mcp'
let server: Server
let issuer: string
let privateKey: CryptoKey

before(async () => {
  const pair = await generateKeyPair('RS256')
  privateKey = pair.privateKey
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' }
  server = createServer((req, res) => {
    if (req.url?.endsWith('/jwks')) res.setHeader('content-type', 'application/json').end(JSON.stringify({ keys: [jwk] }))
    else res.writeHead(404).end()
  })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/auth`
})
after(() => server.close())

const token = (claims: { iss?: string; aud?: string } = {}) =>
  new SignJWT({ scope: 'openid' })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setSubject('user-1')
    .setIssuer(claims.iss ?? issuer)
    .setAudience(claims.aud ?? RESOURCE)
    .setExpirationTime('5m')
    .sign(privateKey)

function setup() {
  const calls: unknown[] = []
  const handler = createProtectedMcp({ authIssuer: issuer, mcpResource: RESOURCE }, async (_req, claims) => {
    calls.push(claims)
    return new Response('ok')
  })
  const call = (authorization?: string) =>
    handler(new Request(RESOURCE, { method: 'POST', headers: authorization ? { authorization } : {} }))
  return { calls, call }
}

test('no token: 401 with RFC 9728 challenge, handler not called', async () => {
  const { calls, call } = setup()
  const res = await call()
  assert.equal(res.status, 401)
  assert.match(res.headers.get('www-authenticate') ?? '', /resource_metadata=/)
  assert.equal(calls.length, 0)
})

test('malformed token: 401, handler not called', async () => {
  const { calls, call } = setup()
  assert.equal((await call('Bearer abc.def.ghi')).status, 401)
  assert.equal(calls.length, 0)
})

test('valid token: handler receives verified claims', async () => {
  const { calls, call } = setup()
  const res = await call(`Bearer ${await token()}`)
  assert.equal(res.status, 200)
  assert.equal((calls[0] as { sub: string }).sub, 'user-1')
})

test('wrong audience or issuer: 401', async () => {
  const { calls, call } = setup()
  assert.equal((await call(`Bearer ${await token({ aud: 'https://other.example.com/mcp' })}`)).status, 401)
  assert.equal((await call(`Bearer ${await token({ iss: 'https://evil.example.com' })}`)).status, 401)
  assert.equal(calls.length, 0)
})

test('resource metadata path only matches the resource path', () => {
  assert.equal(isResourceMetadataPath('', RESOURCE), true)
  assert.equal(isResourceMetadataPath('mcp', RESOURCE), true)
  assert.equal(isResourceMetadataPath('other', RESOURCE), false)
})
