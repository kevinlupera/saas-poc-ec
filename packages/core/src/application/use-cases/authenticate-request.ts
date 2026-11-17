import { UnauthenticatedError } from '../errors.ts'
import type { AuthenticateRequest } from '../ports/in/authenticate-request.ts'
import type { IdentityProvider } from '../ports/out/identity-provider.ts'

export const makeAuthenticateRequest =
  (identity: IdentityProvider): AuthenticateRequest =>
  async (headers) => {
    const principal = await identity.resolve(headers)
    if (!principal) throw new UnauthenticatedError('Authentication required')
    return principal
  }
