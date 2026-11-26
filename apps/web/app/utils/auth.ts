export const AUTH_ROUTES = {
  login: '/login', register: '/registro', recovery: '/recuperar-contrasena',
  reset: '/restablecer-contrasena', verify: '/verificar-email', complete: '/auth/complete',
} as const

// No caller-supplied return destination: URL query parameters are never trusted.
export function authCallback(origin: string, destination: keyof typeof AUTH_ROUTES) {
  return new URL(AUTH_ROUTES[destination], origin).href
}

const SCRIPT_SCHEMES = new Set(['javascript:', 'data:', 'vbscript:'])

/**
 * Where to go after sign-in. During an agent's OAuth authorization the page carries the API's signed
 * query, and the sign-in response holds the URL that resumes it (the consent page, or the agent's
 * registered callback when consent was already given). That URL comes from the API, never from the
 * page query. Anything else ends at the normal return.
 */
export function oauthContinuation(search: string, data: unknown): string {
  const params = new URLSearchParams(search)
  const { redirect, url } = (data ?? {}) as { redirect?: unknown; url?: unknown }
  if (params.has('sig') && params.has('ba_param') && redirect === true && typeof url === 'string') {
    try {
      const next = new URL(url)
      if (!SCRIPT_SCHEMES.has(next.protocol)) return next.href
    } catch {
      // Not an absolute URL: fall through to the normal return.
    }
  }
  return AUTH_ROUTES.complete
}

export type AuthError = { code?: string; status?: number }
export function authErrorMessage(error?: AuthError | null) {
  if (error?.code === 'EMAIL_NOT_VERIFIED') return 'Verifica tu email antes de iniciar sesión.'
  if (error?.code === 'INVALID_EMAIL_OR_PASSWORD' || error?.code === 'INVALID_PASSWORD'
    || error?.code === 'USER_NOT_FOUND') return 'No pudimos iniciar sesión. Revisa tu email y contraseña.'
  if (error?.code === 'INVALID_TOKEN' || error?.code === 'TOKEN_EXPIRED') return 'El enlace no es válido o ha vencido. Solicita uno nuevo.'
  if (error?.status === 429) return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.'
  return 'No pudimos completar la solicitud. Comprueba tu conexión e inténtalo de nuevo.'
}

export function emailError(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? '' : 'Introduce un email válido.'
}

// Better Auth defaults; the API must enforce the same policy (see README).
export function passwordError(password: string) {
  return password.length >= 8 && password.length <= 128 ? '' : 'Usa entre 8 y 128 caracteres.'
}

export function focusFirstError(form: HTMLFormElement | null) {
  form?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
}
