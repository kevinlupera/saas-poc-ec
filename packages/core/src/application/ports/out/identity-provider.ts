import type { Principal } from '../../../domain/principal.ts'

/** Driven port: resolves a request's credentials (cookie, API key, token) to a Principal. */
export interface IdentityProvider {
  resolve(headers: Headers): Promise<Principal | null>
}
