import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Principal } from '../../domain/principal.ts'
import { asRole, scopesFromPermissions } from '../../domain/role.ts'
import { ForbiddenError, UnauthenticatedError } from '../errors.ts'
import { makeAuthenticateRequest } from './authenticate-request.ts'
import { authorizeAction } from './authorize-action.ts'

const user = (role: Principal['role'], tenantId = 't1'): Principal => ({ kind: 'user', id: 'u', tenantId, role })

test('authenticate returns the principal from the identity provider', async () => {
  const principal = user('owner')
  const auth = makeAuthenticateRequest({ resolve: async () => principal })
  assert.deepEqual(await auth(new Headers()), principal)
})

test('authenticate rejects when no identity resolves', async () => {
  const auth = makeAuthenticateRequest({ resolve: async () => null })
  await assert.rejects(auth(new Headers()), UnauthenticatedError)
})

test('authorize: recepcion cannot see revenue, owner can', () => {
  assert.throws(() => authorizeAction(user('recepcion'), 'business:revenue', 't1'), ForbiddenError)
  assert.doesNotThrow(() => authorizeAction(user('owner'), 'business:revenue', 't1'))
})

test('tenant isolation: an owner of t1 is forbidden in t2', () => {
  assert.throws(() => authorizeAction(user('owner', 't1'), 'agenda:own', 't2'), ForbiddenError)
})

test('tenant isolation: a principal without tenant is forbidden everywhere', () => {
  const p: Principal = { kind: 'user', id: 'u', role: 'owner' }
  assert.throws(() => authorizeAction(p, 'agenda:own', 't1'), ForbiddenError)
})

test('api key: no scopes means no access, scopes grant only what they list', () => {
  const key = (scopes?: Principal['scopes']): Principal => ({ kind: 'apiKey', id: 'k', tenantId: 't1', scopes })
  assert.throws(() => authorizeAction(key(), 'agenda:own', 't1'), ForbiddenError)
  assert.doesNotThrow(() => authorizeAction(key(['agenda:own']), 'agenda:own', 't1'))
  assert.throws(() => authorizeAction(key(['agenda:own']), 'business:revenue', 't1'), ForbiddenError)
  assert.throws(() => authorizeAction(key(['agenda:own']), 'agenda:own', 't2'), ForbiddenError)
})

test('scopesFromPermissions keeps valid actions and drops the rest', () => {
  assert.deepEqual(scopesFromPermissions({ saas: ['agenda:own', 'root', 3] }), ['agenda:own'])
  assert.deepEqual(scopesFromPermissions({ other: ['agenda:own'] }), [])
  assert.deepEqual(scopesFromPermissions(null), [])
})

test('asRole only accepts known roles', () => {
  assert.equal(asRole('admin'), 'admin')
  assert.equal(asRole('superuser'), undefined)
})
