import { test, expect, type Page, type Route } from '@playwright/test'

const identity = {
  session: { id: 'session-test', userId: 'user-test', token: 'fixture-only', expiresAt: '2099-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  user: { id: 'user-test', name: 'Test User', email: 'person@example.test', emailVerified: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
}
const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

type ApiOptions = { signed?: boolean; registerSession?: boolean; sessionFailure?: boolean }
async function api(page: Page, options: ApiOptions = {}) {
  const state = { signed: !!options.signed, sessionFailure: !!options.sessionFailure }
  await page.route('http://localhost:3001/api/auth/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/get-session')) return state.sessionFailure ? json(route, { message: 'Internal error' }, 503) : json(route, state.signed ? identity : null)
    if (path.endsWith('/sign-in/email')) { state.signed = true; return json(route, { redirect: false, token: 'fixture-only', user: identity.user }) }
    if (path.endsWith('/sign-up/email')) { state.signed = !!options.registerSession; return json(route, { token: state.signed ? 'fixture-only' : null, user: identity.user }) }
    if (path.endsWith('/sign-out')) { state.signed = false; return json(route, { success: true }) }
    return json(route, { status: true })
  })
  return state
}
async function credentials(page: Page, register = false) {
  if (register) await page.getByLabel('Nombre', { exact: true }).fill('Test User')
  await page.getByLabel('Email', { exact: true }).fill('person@example.test')
  await page.getByLabel('Contraseña', { exact: true }).fill('safe-password-123')
  if (register) await page.getByLabel('Confirmar contraseña', { exact: true }).fill('safe-password-123')
}

for (const path of ['/terms', '/privacy', '/support']) {
  test(`public page resolves footer link and renders at mobile width: ${path}`, async ({ page }) => {
    await page.goto('/')
    await page.locator(`footer a[href="${path}"]`).click()
    await expect(page).toHaveURL(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const response = await page.reload()
    expect(response?.status()).toBe(200)
    if (path !== '/support') {
      await expect(page.getByText('Borrador · Pendiente de revisión', { exact: true })).toBeVisible()
      await expect(page.locator('input[type="checkbox"]')).toHaveCount(0)
    } else {
      for (const href of ['/login', '/registro', '/recuperar-contrasena', '/verificar-email']) {
        await expect(page.locator(`article a[href="${href}"]`)).toBeVisible()
      }
      await expect(page.locator('article a[href^="mailto:"], article a[href^="tel:"]')).toHaveCount(0)
    }
    await page.setViewportSize({ width: 320, height: 740 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.getByRole('button', { name: /Cambiar a modo/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.getByRole('link', { name: 'Volver al inicio', exact: true }).click()
    await expect(page).toHaveURL('/')
  })
}

for (const path of ['/login', '/registro', '/recuperar-contrasena', '/restablecer-contrasena', '/verificar-email', '/auth/complete']) {
  test(`direct static route and reload: ${path}`, async ({ page }) => {
    await api(page)
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer')
  })
}

test('login validates before requests, focuses invalid input and permits password visibility/paste', async ({ page }) => {
  let requests = 0
  await page.route('**/api/auth/sign-in/email', route => { requests++; return json(route, {}, 400) })
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).press('Enter')
  await expect(page.getByLabel('Email', { exact: true })).toBeFocused()
  await expect(page.getByText('Introduce un email válido.')).toBeVisible()
  expect(requests).toBe(0)
  await page.getByLabel('Contraseña', { exact: true }).fill('pasted-password')
  await page.getByRole('button', { name: 'Mostrar contraseña', exact: true }).click()
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text')
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('autocomplete', 'current-password')
  expect(await page.getByLabel('Contraseña', { exact: true }).evaluate(el => el.getAttribute('onpaste'))).toBeNull()
})

test('login can validate and complete using only the keyboard', async ({ page }) => {
  await api(page)
  await page.goto('/login')
  const email = page.getByLabel('Email', { exact: true })
  for (let steps = 0; steps < 10; steps++) {
    await page.keyboard.press('Tab')
    if (await email.evaluate(el => document.activeElement === el)) break
  }
  await expect(email).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toBeFocused()
  await page.keyboard.type('person@example.test')
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Contraseña', { exact: true })).toBeFocused()
  await page.keyboard.type('safe-password-123')
  const request = page.waitForRequest('**/api/auth/sign-in/email')
  await page.keyboard.press('Enter')
  expect((await request).postDataJSON()).toEqual({ email: 'person@example.test', password: 'safe-password-123' })
  await expect(page).toHaveURL('/auth/complete')
  await expect(page.getByText('Sesión iniciada', { exact: true })).toBeVisible()
})

test('credential login confirms session, ignores external next and can sign out', async ({ page }) => {
  await api(page)
  await page.goto('/login?next=https://outside.example')
  await credentials(page)
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await expect(page).toHaveURL('/auth/complete')
  await expect(page.getByText('Sesión iniciada', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('person@example.test', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL('/login')
  await page.goto('/auth/complete?authenticated=true')
  await expect(page.getByText('No hay una sesión activa.', { exact: false })).toBeVisible()
})

for (const code of ['INVALID_EMAIL_OR_PASSWORD', 'EMAIL_NOT_VERIFIED', 'FORBIDDEN', 'UNRECOGNIZED']) {
  test(`login handles ${code} safely`, async ({ page }) => {
    await api(page)
    await page.route('**/api/auth/sign-in/email', route => json(route, { code, message: '<b>internal-secret</b>' }, code === 'INVALID_EMAIL_OR_PASSWORD' ? 401 : 403))
    await page.goto('/login')
    await credentials(page)
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByText('internal-secret', { exact: false })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Verificar mi email' })).toHaveCount(code === 'EMAIL_NOT_VERIFIED' ? 1 : 0)
    await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeEnabled()
  })
}

test('unavailable identity API is recoverable, not a successful login', async ({ page }) => {
  await page.route('**/api/auth/**', route => route.abort('failed'))
  await page.goto('/login')
  await credentials(page)
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('No pudimos completar')
  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeEnabled()
})

test('a pending login cannot be submitted twice', async ({ page }) => {
  await api(page)
  let count = 0
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/auth/sign-in/email', async route => { count++; await gate; await json(route, { code: 'INVALID_EMAIL_OR_PASSWORD' }, 401) })
  await page.goto('/login')
  await credentials(page)
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Conectando…' })).toBeDisabled()
  await page.locator('form').evaluate(form => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
  expect(count).toBe(1)
  release()
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeEnabled()
})

for (const registerSession of [false, true]) {
  test(`registration distinguishes accepted request from session: ${registerSession}`, async ({ page }) => {
    await api(page, { registerSession })
    await page.goto('/registro')
    await credentials(page, true)
    const request = page.waitForRequest('**/api/auth/sign-up/email')
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
    const body = (await request).postDataJSON()
    expect(Object.keys(body).sort()).toEqual(['callbackURL', 'email', 'name', 'password'].sort())
    expect(body.callbackURL).toBe('http://127.0.0.1:4173/verificar-email')
    await expect(page).toHaveURL(registerSession ? '/auth/complete' : '/verificar-email')
    if (registerSession) await expect(page.getByText('Sesión iniciada', { exact: true })).toBeVisible()
    else await expect(page.getByText('Sesión iniciada', { exact: true })).toHaveCount(0)
  })
}

for (const sample of [
  { name: 'empty name', field: 'Nombre', value: '' },
  { name: 'malformed email', field: 'Email', value: 'invalid' },
  { name: 'empty password', field: 'Contraseña', value: '' },
  { name: 'empty confirmation', field: 'Confirmar contraseña', value: '' },
  { name: 'short password', field: 'Contraseña', value: 'short' },
  { name: 'overlong password', field: 'Contraseña', value: 'x'.repeat(129) },
]) {
  test(`registration rejects ${sample.name} on Enter without an API request`, async ({ page }) => {
    let requests = 0
    await api(page)
    await page.route('**/api/auth/sign-up/email', route => { requests++; return json(route, {}, 400) })
    await page.goto('/registro')
    await credentials(page, true)
    const invalidField = page.getByLabel(sample.field, { exact: true })
    await invalidField.fill(sample.value)
    await page.getByLabel('Confirmar contraseña', { exact: true }).press('Enter')
    await expect(invalidField).toHaveAttribute('aria-invalid', 'true')
    await expect(invalidField).toBeFocused()
    const errorId = await invalidField.getAttribute('aria-describedby')
    expect(errorId).toContain('-error')
    await expect(page.locator(`#${errorId!.split(' ').find(id => id.endsWith('-error'))}`)).toBeVisible()
    expect(requests).toBe(0)
    await expect(page).toHaveURL('/registro')
  })
}

test('registration rejects mismatched passwords before API and safely presents server rejection', async ({ page }) => {
  let count = 0
  await api(page)
  await page.route('**/api/auth/sign-up/email', route => { count++; return json(route, { code: 'USER_ALREADY_EXISTS', message: 'already exists internal-secret' }, 422) })
  await page.goto('/registro')
  await credentials(page, true)
  await page.getByLabel('Confirmar contraseña', { exact: true }).fill('different-password')
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
  await expect(page.getByLabel('Confirmar contraseña', { exact: true })).toBeFocused()
  expect(count).toBe(0)
  await page.getByLabel('Confirmar contraseña', { exact: true }).fill('safe-password-123')
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('No pudimos completar')
  await expect(page.getByText('internal-secret', { exact: false })).toHaveCount(0)
})

test('session loading, lookup failure and retry remain distinct from anonymous', async ({ page }) => {
  const state = await api(page, { sessionFailure: true })
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/auth/get-session', async route => { await gate; await json(route, { code: 'UNAVAILABLE' }, 503) }, { times: 1 })
  await page.goto('/auth/complete')
  await expect(page.getByText('Comprobando tu sesión…')).toBeVisible()
  release()
  await expect(page.getByRole('alert')).toContainText('No pudimos comprobar tu sesión')
  await expect(page.getByText('No hay una sesión activa.', { exact: false })).toHaveCount(0)
  state.sessionFailure = false
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByText('No hay una sesión activa.', { exact: false })).toBeVisible()
})

test('failed sign-out retains the confirmed identity', async ({ page }) => {
  await api(page, { signed: true })
  await page.route('**/api/auth/sign-out', route => json(route, { code: 'UNAVAILABLE' }, 503))
  await page.goto('/auth/complete')
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByText('person@example.test', { exact: true })).toBeVisible()
  await expect(page).toHaveURL('/auth/complete')
})

for (const start of ['/login', '/registro']) {
  test(`Google redirects through official client from ${start}`, async ({ page }) => {
    const state = await api(page)
    await page.route('**/api/auth/sign-in/social', route => {
      const body = route.request().postDataJSON()
      expect(body.provider).toBe('google')
      expect(body.callbackURL).toBe('http://127.0.0.1:4173/auth/complete')
      expect(body.newUserCallbackURL).toBe(body.callbackURL)
      expect(body.errorCallbackURL).toBe('http://127.0.0.1:4173/login?error=oauth')
      expect(body.password).toBeUndefined()
      state.signed = true
      // Test-only stand-in for the final provider redirect, not real Google OAuth.
      return json(route, { url: body.callbackURL, redirect: true })
    })
    await page.goto(`${start}?next=//outside.example`)
    await page.getByRole('button', { name: 'Continuar con Google' }).click()
    await expect(page).toHaveURL('/auth/complete')
    await expect(page.getByText('Sesión iniciada', { exact: true })).toBeVisible()
  })
}

test('Google startup failure and cancelled return are recoverable', async ({ page }) => {
  await api(page)
  await page.route('**/api/auth/sign-in/social', route => json(route, { code: 'PROVIDER_NOT_FOUND', message: 'internal-secret' }, 400))
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar con Google' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continuar con Google' })).toBeEnabled()
  await page.goto('/login?error=access_denied&error_description=internal-secret')
  await expect(page.getByRole('alert')).toContainText('No pudimos completar el acceso con Google')
  await expect(page.getByText('internal-secret', { exact: false })).toHaveCount(0)
  // Real Better Auth return on cancel: our `error=oauth` plus Google's own, i.e. a repeated parameter.
  await page.goto('/login?error=oauth&error=access_denied')
  await expect(page.getByRole('alert')).toContainText('No pudimos completar el acceso con Google')
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeEnabled()
  await page.goto('/auth/complete?success=true')
  await expect(page.getByText('No hay una sesión activa.', { exact: false })).toBeVisible()
})

for (const mode of ['recovery', 'verify'] as const) {
  test(`${mode}: validation, duplicate prevention, generic acceptance and failed request`, async ({ page }) => {
    await api(page)
    const path = mode === 'verify' ? '/verificar-email' : '/recuperar-contrasena'
    const endpoint = mode === 'verify' ? 'send-verification-email' : 'request-password-reset'
    let count = 0
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    await page.route(`**/api/auth/${endpoint}`, async route => {
      count++
      const body = route.request().postDataJSON()
      expect(body.email).toBe('person@example.test')
      expect(mode === 'verify' ? body.callbackURL : body.redirectTo).toBe(`http://127.0.0.1:4173${mode === 'verify' ? '/verificar-email' : '/restablecer-contrasena'}`)
      await gate
      await json(route, { status: true })
    })
    await page.goto(path)
    await page.locator('form button[type="submit"]').click()
    await expect(page.getByLabel('Email', { exact: true })).toBeFocused()
    expect(count).toBe(0)
    await page.getByLabel('Email', { exact: true }).fill('person@example.test')
    await page.locator('form button[type="submit"]').click()
    await expect(page.locator('form button[type="submit"]')).toBeDisabled()
    await page.locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    expect(count).toBe(1)
    release()
    await expect(page.getByRole('status')).toContainText(mode === 'verify' ? 'Si la cuenta necesita verificación' : 'Si existe una cuenta')
    await page.route(`**/api/auth/${endpoint}`, route => route.abort('failed'))
    await page.locator('form button[type="submit"]').click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByText('recibirás instrucciones', { exact: false })).toHaveCount(0)
  })
}

for (const rejected of [false, true]) {
  test(`password reset validates, removes query secret and handles token result: ${rejected}`, async ({ page }) => {
    await api(page)
    let requests = 0
    await page.route('**/api/auth/reset-password', route => {
      requests++
      const body = route.request().postDataJSON()
      expect(body).toEqual({ token: 'reset-fixture-only', newPassword: 'new-password-123' })
      return rejected ? json(route, { code: 'INVALID_TOKEN' }, 400) : json(route, { status: true })
    })
    await page.goto('/restablecer-contrasena?token=reset-fixture-only')
    await expect(page).toHaveURL('/restablecer-contrasena')
    await page.getByLabel('Nueva contraseña', { exact: true }).fill('new-password-123')
    await page.getByLabel('Confirmar contraseña', { exact: true }).fill('wrong-password')
    await page.getByRole('button', { name: 'Guardar nueva contraseña', exact: true }).click()
    await expect(page.getByLabel('Confirmar contraseña', { exact: true })).toBeFocused()
    expect(requests).toBe(0)
    await page.getByLabel('Confirmar contraseña', { exact: true }).fill('new-password-123')
    await page.getByRole('button', { name: 'Guardar nueva contraseña', exact: true }).click()
    if (rejected) await expect(page.getByRole('link', { name: 'Solicitar otro enlace' })).toBeVisible()
    else await expect(page.getByRole('status')).toContainText('Contraseña actualizada')
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('reset-fixture-only')
    await page.reload()
    await expect(page.getByRole('link', { name: 'Solicitar otro enlace' })).toBeVisible()
  })
}

test('missing and expired reset links do not offer password submission', async ({ page }) => {
  await api(page)
  for (const query of ['', '?error=INVALID_TOKEN', '?error=TOKEN_EXPIRED&token=old']) {
    await page.goto(`/restablecer-contrasena${query}`)
    await expect(page.getByRole('alert')).toContainText('El enlace no es válido')
    await expect(page.getByRole('link', { name: 'Solicitar otro enlace' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Guardar nueva contraseña' })).toHaveCount(0)
  }
})

test('verification trusts API session, not query flags, and confirms a valid return', async ({ page }) => {
  const state = await api(page)
  await page.goto('/verificar-email?verified=true&success=true')
  await expect(page.getByRole('button', { name: 'Reenviar verificación' })).toBeVisible()
  await expect(page.getByText('Tu email está verificado.', { exact: true })).toHaveCount(0)
  state.signed = true
  await page.goto('/verificar-email')
  await expect(page.getByText('Tu email está verificado.', { exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Reenviar verificación' })).toHaveCount(0)
})

for (const signed of [false, true]) {
  for (const code of ['invalid_token', 'token_expired']) {
    test(`verification link error remains actionable: ${code}, verified session ${signed}`, async ({ page }) => {
      await api(page, { signed })
      const sessionResponse = page.waitForResponse('**/api/auth/get-session')
      await page.goto(`/verificar-email?error=${code}`)
      await (await sessionResponse).finished()
      // Assert after the session response has reached Vue, not just while the
      // anonymous/loading form briefly renders before a verified session arrives.
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
      await expect(page.getByRole('alert')).toContainText('El enlace no es válido o ha vencido')
      await expect(page.getByText('Tu email está verificado.', { exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Reenviar verificación' })).toBeVisible()
      await page.getByLabel('Email', { exact: true }).fill('person@example.test')
      const resend = page.waitForRequest('**/api/auth/send-verification-email')
      await page.getByLabel('Email', { exact: true }).press('Enter')
      expect((await resend).postDataJSON()).toEqual({ email: 'person@example.test', callbackURL: 'http://127.0.0.1:4173/verificar-email' })
      await expect(page.getByRole('status')).toContainText('Si la cuenta necesita verificación')
    })
  }
}

test('landing links, keyboard focus, mobile widths and theme stay usable', async ({ page }) => {
  await api(page)
  await page.goto('/')
  await expect(page.locator('a[href="/login"]').first()).toBeVisible()
  await expect(page.locator('a[href="/registro"]').first()).toBeVisible()
  await expect(page.locator('a[href="#login"], a[href="#registro"]')).toHaveCount(0)
  await page.locator('a[href="/login"]').first().click()
  await expect(page).toHaveURL('/login')
  await page.getByLabel('Email', { exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Contraseña', { exact: true })).toBeFocused()
  await page.setViewportSize({ width: 320, height: 740 })
  for (const path of ['/login', '/registro', '/recuperar-contrasena', '/restablecer-contrasena', '/verificar-email', '/auth/complete']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
  await page.goto('/login')
  const darkBefore = await page.locator('html').evaluate(el => el.classList.contains('dark'))
  await page.getByRole('button', { name: /Cambiar a modo/ }).click()
  await expect(page.locator('html')).toHaveClass(darkBefore ? /^(?!.*dark)/ : /dark/)
  await page.reload()
  expect(await page.locator('html').evaluate(el => el.classList.contains('dark'))).toBe(!darkBefore)
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir menú' }).click()
  await page.locator('a[href="/registro"]').filter({ visible: true }).first().click()
  await expect(page).toHaveURL('/registro')
})
