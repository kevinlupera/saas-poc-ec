import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createWebAuthClient } from '../app/utils/auth-client.ts'
import { AUTH_ROUTES, authCallback, authErrorMessage, emailError, oauthContinuation, passwordError } from '../app/utils/auth.ts'

for (const base of ['http://localhost:3001', 'https://identity.example.test', 'https://identity.example.test/api/auth/']) {
  test(`client uses configured API and cookies: ${base}`, async (t) => {
    const requests = []
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      requests.push({ url: String(url), options })
      return Response.json(null)
    })
    const client = createWebAuthClient(base)
    assert.equal(requests.length, 0, 'creating a client must not request a session')
    await client.getSession()
    assert.equal(requests[0].url, `${new URL(base).origin}/api/auth/get-session`)
    assert.equal(requests[0].options.credentials, 'include')
  })
}

test('client plugin is browser-only and never resolves sessions at import', () => {
  const plugin = readFileSync(new URL('../app/plugins/auth.client.ts', import.meta.url), 'utf8')
  assert.match(plugin, /useRuntimeConfig\(\)\.public\.apiBase/)
  assert.doesNotMatch(plugin, /getSession|useSession|better-auth\/(?:api|adapters)/)
})

test('errors are safe, do not echo backend text, and verification uses an explicit code', () => {
  const internal = { status: 403, message: '<script>secret</script>' }
  assert.equal(authErrorMessage(internal), authErrorMessage())
  assert.notEqual(authErrorMessage({ code: 'EMAIL_NOT_VERIFIED', status: 403 }), authErrorMessage(internal))
  for (const code of ['INVALID_EMAIL_OR_PASSWORD', 'INVALID_PASSWORD', 'USER_NOT_FOUND']) {
    assert.equal(authErrorMessage({ code }), authErrorMessage({ code: 'INVALID_EMAIL_OR_PASSWORD' }))
  }
  assert.match(authErrorMessage({ status: 429 }), /Demasiados intentos/)
  assert.match(authErrorMessage({ code: 'TOKEN_EXPIRED' }), /enlace/)
})

test('identity utilities do not persist or log credentials and tokens', () => {
  for (const path of ['../app/utils/auth.ts', '../app/utils/auth-client.ts', '../app/plugins/auth.client.ts']) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /localStorage|sessionStorage|console\.(log|warn|error)|document\.cookie/)
  }
})

test('return URLs use only fixed application paths', () => {
  for (const next of ['https://outside.example', '//outside.example', '/admin', 'javascript:alert(1)']) {
    const origin = new URL(`https://web.example.test/login?next=${encodeURIComponent(next)}`).origin
    assert.equal(authCallback(origin, 'complete'), 'https://web.example.test/auth/complete')
  }
  assert.equal(authCallback('https://web.example.test', 'reset'), `https://web.example.test${AUTH_ROUTES.reset}`)
})

test('email and password validation matches documented default policy', () => {
  assert.ok(emailError('invalid'))
  assert.equal(emailError(' person@example.test '), '')
  assert.ok(passwordError('short'))
  assert.equal(passwordError('x'.repeat(8)), '')
  assert.equal(passwordError('x'.repeat(128)), '')
  assert.ok(passwordError('x'.repeat(129)))
})

// What the API appends to /login and /consent during an agent's OAuth authorization (signed, with its parameter list).
const SIGNED = '?client_id=agent&scope=openid&ba_param=ba_param&ba_param=client_id&ba_param=scope&sig=signature'

async function postFrom(t, search) {
  const bodies = []
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    bodies.push(JSON.parse(options.body ?? '{}'))
    return Response.json({ redirect: false })
  })
  globalThis.window = { location: { search } }
  t.after(() => { delete globalThis.window })
  await createWebAuthClient('http://localhost:3001').signIn.email({ email: 'a@b.co', password: 'password1234' })
  return bodies[0]
}

test('during an OAuth authorization, auth calls carry the signed query so the API resumes it', async (t) => {
  const body = await postFrom(t, SIGNED)
  assert.equal(new URLSearchParams(body.oauth_query).get('sig'), 'signature')
  assert.equal(new URLSearchParams(body.oauth_query).get('client_id'), 'agent')
})

test('outside an OAuth authorization, auth calls carry no OAuth query', async (t) => {
  assert.equal((await postFrom(t, '?next=/admin')).oauth_query, undefined)
})

test('after sign-in, only an OAuth authorization follows the URL the API returns', () => {
  const consent = { redirect: true, url: 'https://web.example.test/consent?client_id=agent&sig=x' }
  // Consent already given: the API sends the browser straight back to the agent's registered callback.
  const agentCallback = { redirect: true, url: 'http://127.0.0.1:8123/cb?code=abc&state=xyz' }
  assert.equal(oauthContinuation(SIGNED, consent), consent.url)
  assert.equal(oauthContinuation(SIGNED, agentCallback), agentCallback.url)
  assert.equal(oauthContinuation('', consent), AUTH_ROUTES.complete)
  assert.equal(oauthContinuation('?sig=forged-without-params', agentCallback), AUTH_ROUTES.complete)
  assert.equal(oauthContinuation(SIGNED, { redirect: false, token: 't' }), AUTH_ROUTES.complete)
  assert.equal(oauthContinuation(SIGNED, { redirect: true, url: 'javascript:alert(1)' }), AUTH_ROUTES.complete)
  assert.equal(oauthContinuation(SIGNED, null), AUTH_ROUTES.complete)
})
