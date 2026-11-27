/**
 * Extra rules for open dynamic client registration (RFC 7591, `POST /oauth2/register`), on top of
 * what Better Auth already checks (fragments, credentials, http on remote hosts, `skip_consent`,
 * unsupported grants, scopes outside the allowed list).
 */

/** RFC 7591 metadata Better Auth accepts. Anything else is rejected, not silently dropped. */
const KNOWN_FIELDS = new Set([
  'redirect_uris',
  'scope',
  'client_name',
  'client_uri',
  'logo_uri',
  'contacts',
  'tos_uri',
  'policy_uri',
  'software_id',
  'software_version',
  'software_statement',
  'post_logout_redirect_uris',
  'token_endpoint_auth_method',
  'grant_types',
  'response_types',
  'application_type',
  'resources',
  'require_pkce',
])
/** Shown to users (consent screen) or fetched by clients: https only. */
const HTTPS_FIELDS = ['client_uri', 'logo_uri', 'tos_uri', 'policy_uri'] as const
const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]'])
export const MAX_CLIENT_NAME = 100
export const MAX_REDIRECT_URIS = 5
const MAX_URI = 2048

function redirectUriProblem(uri: unknown): string | undefined {
  if (typeof uri !== 'string' || uri.length > MAX_URI) return 'redirect_uris must be strings of at most 2048 chars'
  if (uri.includes('*')) return 'redirect_uris must not contain wildcards'
  let url: URL
  try {
    url = new URL(uri)
  } catch {
    return 'redirect_uris must be absolute URIs'
  }
  if (url.protocol === 'https:') return undefined
  if (url.protocol === 'http:' && LOOPBACK.has(url.hostname)) return undefined
  return 'redirect_uris must use https, or http on localhost, 127.0.0.1 or [::1]'
}

/** RFC 7591 §3.2.2 error for a rejected registration. */
export interface RegistrationProblem {
  error: 'invalid_redirect_uri' | 'invalid_client_metadata'
  description: string
}

const metadata = (description: string): RegistrationProblem => ({ error: 'invalid_client_metadata', description })

/** First problem with a registration body, or undefined when it may go on to Better Auth. */
export function registrationProblem(body: unknown): RegistrationProblem | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return metadata('body must be a JSON object')
  const fields = body as Record<string, unknown>
  const unknown = Object.keys(fields).filter((key) => !KNOWN_FIELDS.has(key))
  if (unknown.length) return metadata(`unsupported client metadata: ${unknown.join(', ')}`)
  if (fields.require_pkce !== undefined && fields.require_pkce !== true) return metadata('pkce is required')
  const name = fields.client_name
  if (name !== undefined && (typeof name !== 'string' || name.length > MAX_CLIENT_NAME)) return metadata(`client_name must be at most ${MAX_CLIENT_NAME} chars`)
  const uris = fields.redirect_uris
  if (uris !== undefined) {
    if (!Array.isArray(uris) || uris.length > MAX_REDIRECT_URIS) return { error: 'invalid_redirect_uri', description: `at most ${MAX_REDIRECT_URIS} redirect_uris` }
    for (const uri of uris) {
      const description = redirectUriProblem(uri)
      if (description) return { error: 'invalid_redirect_uri', description }
    }
  }
  for (const key of HTTPS_FIELDS) {
    const value = fields[key]
    if (value === undefined) continue
    if (typeof value !== 'string' || value.length > MAX_URI || !URL.canParse(value) || new URL(value).protocol !== 'https:') return metadata(`${key} must be an https URL`)
  }
  return undefined
}
