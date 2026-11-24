import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resendSender } from '../src/adapters/email.ts'

const message = { to: 'ana@example.com', subject: 'Verifica tu email', text: 'link', html: '<p>link</p>' }

test('posts the message to the Resend API with the sender and bearer key', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response('{"id":"1"}', { status: 200 }))
  await resendSender({ apiKey: 're_secret', from: 'CitasSaaS <no-reply@example.com>' })(message)
  assert.equal(fetch.mock.callCount(), 1)
  const [url, init] = fetch.mock.calls[0]!.arguments as [string, RequestInit]
  assert.equal(url, 'https://api.resend.com/emails')
  assert.equal(init.method, 'POST')
  assert.equal(new Headers(init.headers).get('authorization'), 'Bearer re_secret')
  assert.deepEqual(JSON.parse(String(init.body)), { from: 'CitasSaaS <no-reply@example.com>', ...message })
})

test('a non-2xx answer rejects without echoing the key', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{"message":"invalid key"}', { status: 401 }))
  await assert.rejects(resendSender({ apiKey: 're_secret', from: 'a@b.co' })(message), (error: Error) => {
    assert.match(error.message, /401/)
    assert.equal(error.message.includes('re_secret'), false)
    return true
  })
})

test('verification link without a web callback returns to the web verification page', async () => {
  const { verificationLink } = await import('../src/auth.ts')
  const api = 'http://localhost:3001/api/auth/verify-email?token=t.k'
  assert.equal(new URL(verificationLink(`${api}&callbackURL=%2F`, 'http://localhost:3000')).searchParams.get('callbackURL'), 'http://localhost:3000/verificar-email')
  const own = `${api}&callbackURL=${encodeURIComponent('http://localhost:3000/verificar-email?x=1')}`
  assert.equal(new URL(verificationLink(own, 'http://localhost:3000')).searchParams.get('callbackURL'), 'http://localhost:3000/verificar-email?x=1')
  assert.equal(new URL(verificationLink(own, 'http://localhost:3000')).searchParams.get('token'), 't.k')
})

test('verification email escapes the link in HTML', async () => {
  const { verificationEmail } = await import('../src/auth.ts')
  const mail = verificationEmail('ana@example.com', 'http://a/x?t=1&c="<b>')
  assert.match(mail.html, /href="http:\/\/a\/x\?t=1&amp;c=&quot;&lt;b&gt;"/)
  assert.match(mail.text, /http:\/\/a\/x\?t=1&c="<b>/)
})
