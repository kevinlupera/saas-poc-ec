export class UnauthenticatedError extends Error {
  override readonly name = 'UnauthenticatedError'
}
export class ForbiddenError extends Error {
  override readonly name: string = 'ForbiddenError'
}
/** Staff without 2FA. A distinct error so clients can send them to enrollment instead of a dead end. */
export class TwoFactorRequiredError extends ForbiddenError {
  override readonly name = 'TwoFactorRequiredError'
}
