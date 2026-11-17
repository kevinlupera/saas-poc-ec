import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ForbiddenError, UnauthenticatedError } from '../errors.ts'
import { makeAuthenticateRequest } from './authenticate-request.ts'
import { authorizeAction } from './authorize-action.ts'

test('authenticate returns the principal from the identity provider', async () => {
  const principal = { kind: 'user', id: 'u1', role: 'owner' } as const
  const auth = makeAuthenticateRequest({ resolve: async () => principal })
  assert.deepEqual(await auth(new Headers()), principal)
})

test('authenticate rejects when no identity resolves', async () => {
  const auth = makeAuthenticateRequest({ resolve: async () => null })
  await assert.rejects(auth(new Headers()), UnauthenticatedError)
})

test('authorize: recepcion cannot see revenue, owner can', () => {
  assert.throws(() => authorizeAction({ kind: 'user', id: 'u', role: 'recepcion' }, 'business:revenue'), ForbiddenError)
  assert.doesNotThrow(() => authorizeAction({ kind: 'user', id: 'u', role: 'owner' }, 'business:revenue'))
})

test('authorize: principal without role is forbidden', () => {
  assert.throws(() => authorizeAction({ kind: 'apiKey', id: 'k' }, 'agenda:own'), ForbiddenError)
})
