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

// Lambda freezes once the response is sent: a send that is not awaited can be lost.
async function authHooks() {
  const { createAuth } = await import('../src/auth.ts')
  const sent: string[] = []
  let release = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))
  const auth = createAuth({
    db: {} as never,
    secret: 'x'.repeat(32),
    baseURL: 'http://localhost:3001',
    trustedOrigins: ['http://localhost:3000'],
    webOrigin: 'http://localhost:3000',
    mcpResource: 'http://localhost:3002/mcp',
    sendEmail: async (message) => { await gate; sent.push(message.subject) },
  })
  return { options: auth.options, sent, release }
}

const settled = async (promise: Promise<unknown>) => {
  let done = false
  promise.then(() => (done = true), () => (done = true))
  await new Promise((resolve) => setTimeout(resolve, 10))
  return done
}

test('verification email resolves only after delivery', async () => {
  const { options, sent, release } = await authHooks()
  const user = { email: 'ana@example.com' } as never
  const pending = options.emailVerification!.sendVerificationEmail!({ user, url: 'http://localhost:3001/api/auth/verify-email?token=t', token: 't' })
  assert.equal(await settled(pending), false)
  release()
  await pending
  assert.equal(sent.length, 1)
})

test('sign-up with an existing email waits for one notice, like a new sign-up', async () => {
  const { options, sent, release } = await authHooks()
  const pending = options.emailAndPassword!.onExistingUserSignUp!({ user: { email: 'ana@example.com' } as never })
  assert.equal(await settled(pending), false)
  release()
  await pending
  assert.equal(sent.length, 1)
})

test('existing account notice links to sign-in and escapes it in HTML', async () => {
  const { existingAccountEmail } = await import('../src/auth.ts')
  const mail = existingAccountEmail('ana@example.com', 'http://a"<b>')
  assert.equal(mail.to, 'ana@example.com')
  assert.match(mail.text, /http:\/\/a"<b>\/login/)
  assert.match(mail.html, /href="http:\/\/a&quot;&lt;b&gt;\/login"/)
})
