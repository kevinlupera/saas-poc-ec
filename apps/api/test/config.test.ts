import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseConfig } from '../server/utils/container.ts'

const base = {
  authSecret: 'x'.repeat(32),
  databaseUrl: 'postgres://u:p@localhost:5433/db',
  authBaseUrl: 'http://localhost:3001',
  webOrigin: 'http://localhost:3000',
  mcpResource: 'http://localhost:3001/mcp',
  resendApiKey: '',
  emailFrom: '',
  smtpHost: 'localhost',
  smtpPort: 1025,
  googleClientId: '',
  googleClientSecret: '',
}
const dev = { production: false }
const prod = { production: true }

const failsWith = (raw: unknown, env: { production: boolean }, keys: string[], secret?: string) =>
  assert.throws(() => parseConfig(raw, env), (error: Error) => {
    for (const key of keys) assert.match(error.message, new RegExp(key))
    if (secret) assert.equal(error.message.includes(secret), false)
    return true
  })

test('outside production without Resend, mail goes to local SMTP (Mailpit defaults)', () => {
  assert.deepEqual(parseConfig(base, dev).mail, { kind: 'smtp', host: 'localhost', port: 1025, from: 'no-reply@localhost' })
})

test('SMTP host and port come from config (env strings included)', () => {
  assert.deepEqual(parseConfig({ ...base, smtpHost: 'mailpit', smtpPort: '2525', emailFrom: 'a@b.co' }, dev).mail,
    { kind: 'smtp', host: 'mailpit', port: 2525, from: 'a@b.co' })
})

test('a Resend key selects Resend in any environment', () => {
  const mail = { kind: 'resend', apiKey: 're_secret', from: 'CitasSaaS <no-reply@example.com>' }
  const raw = { ...base, resendApiKey: 're_secret', emailFrom: mail.from }
  assert.deepEqual(parseConfig(raw, dev).mail, mail)
  assert.deepEqual(parseConfig(raw, prod).mail, mail)
})

test('production without Resend key or sender fails fast, naming keys only', () => {
  failsWith(base, prod, ['resendApiKey', 'emailFrom'])
  failsWith({ ...base, emailFrom: 'a@b.co' }, prod, ['resendApiKey'])
  failsWith({ ...base, resendApiKey: 're_secret' }, prod, ['emailFrom'], 're_secret')
})

test('a Resend key without sender fails outside production too', () => {
  failsWith({ ...base, resendApiKey: 're_secret' }, dev, ['emailFrom'], 're_secret')
})

test('Google is enabled with both credentials, disabled with neither', () => {
  assert.equal(parseConfig(base, dev).google, undefined)
  assert.deepEqual(parseConfig({ ...base, googleClientId: 'id', googleClientSecret: 'gsecret' }, dev).google,
    { clientId: 'id', clientSecret: 'gsecret' })
})

test('only one Google credential fails, naming the missing key', () => {
  failsWith({ ...base, googleClientId: 'id' }, dev, ['googleClientSecret'])
  failsWith({ ...base, googleClientSecret: 'gsecret' }, dev, ['googleClientId'], 'gsecret')
})

test('the MCP resource is served by the API itself (same origin)', () => {
  assert.equal(parseConfig(base, dev).mcpResource, 'http://localhost:3001/mcp')
  failsWith({ ...base, mcpResource: 'http://localhost:3002/mcp' }, dev, ['mcpResource'])
  failsWith({ ...base, mcpResource: 'http://localhost:3001/other' }, dev, ['mcpResource'])
})

test('open client registration (NITRO_OAUTH_DCR_ENABLED): on outside production, off in production unless set', () => {
  const withProd = { ...base, resendApiKey: 're_x', emailFrom: 'a@b.co' }
  assert.equal(parseConfig({ ...base, oauthDcrEnabled: '' }, dev).oauthDcrEnabled, true)
  assert.equal(parseConfig(base, dev).oauthDcrEnabled, true)
  assert.equal(parseConfig(withProd, prod).oauthDcrEnabled, false)
  assert.equal(parseConfig({ ...withProd, oauthDcrEnabled: true }, prod).oauthDcrEnabled, true)
  assert.equal(parseConfig({ ...base, oauthDcrEnabled: 'false' }, dev).oauthDcrEnabled, false)
  failsWith({ ...base, oauthDcrEnabled: 'yes' }, dev, ['oauthDcrEnabled'])
})
