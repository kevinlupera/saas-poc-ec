import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ForbiddenError, TwoFactorRequiredError } from '../application/errors.ts'
import { authorizePlatformAction } from '../application/use-cases/authorize-platform-action.ts'
import { paymentVisibility, resolvePlatformAccess } from './platform.ts'
import type { Principal } from './principal.ts'

const staff = (role: string, twoFactorEnabled = true): Principal => ({ kind: 'user', id: 's', ...resolvePlatformAccess({ role, twoFactorEnabled }) })

test('staff with a verified second factor gets their platform role', () => {
  assert.deepEqual(resolvePlatformAccess({ role: 'soporte', twoFactorEnabled: true }), { platformRole: 'soporte' })
})

test('staff without 2FA gets no platform role, only the enrollment requirement', () => {
  for (const tf of [false, undefined, null, 'true']) {
    assert.deepEqual(resolvePlatformAccess({ role: 'superadmin', twoFactorEnabled: tf }), { twoFactorRequired: true })
  }
})

test('regular users and unknown roles are not staff', () => {
  for (const role of ['user', 'admin', '', undefined, 42]) assert.deepEqual(resolvePlatformAccess({ role, twoFactorEnabled: true }), {})
})

test('comma separated roles: precedence is fixed, not storage order', () => {
  assert.equal(resolvePlatformAccess({ role: 'soporte,superadmin', twoFactorEnabled: true }).platformRole, 'superadmin')
  assert.equal(resolvePlatformAccess({ role: 'superadmin,soporte', twoFactorEnabled: true }).platformRole, 'superadmin')
  assert.equal(resolvePlatformAccess({ role: 'user, finanzas', twoFactorEnabled: true }).platformRole, 'finanzas')
})

test('soporte never sees full payment data; finanzas and superadmin do', () => {
  assert.equal(paymentVisibility(staff('soporte')), 'masked')
  assert.equal(paymentVisibility(staff('finanzas')), 'full')
  assert.equal(paymentVisibility(staff('superadmin')), 'full')
  assert.throws(() => authorizePlatformAction(staff('soporte'), 'platform:payments:read-full'), ForbiddenError)
  assert.doesNotThrow(() => authorizePlatformAction(staff('soporte'), 'platform:payments:read'))
})

test('a staff member without 2FA sees nothing and is told to enroll', () => {
  const p = staff('superadmin', false)
  assert.equal(paymentVisibility(p), 'none')
  assert.throws(() => authorizePlatformAction(p, 'platform:tenants:read'), TwoFactorRequiredError)
})

test('only superadmin manages staff', () => {
  assert.doesNotThrow(() => authorizePlatformAction(staff('superadmin'), 'platform:staff:manage'))
  for (const r of ['soporte', 'finanzas']) assert.throws(() => authorizePlatformAction(staff(r), 'platform:staff:manage'), ForbiddenError)
})

test('a tenant user or api key has no platform access', () => {
  assert.throws(() => authorizePlatformAction({ kind: 'user', id: 'u', tenantId: 't', role: 'owner' }, 'platform:tenants:read'), ForbiddenError)
  assert.equal(paymentVisibility({ kind: 'apiKey', id: 'k', tenantId: 't', scopes: ['agenda:all'] }), 'none')
})
