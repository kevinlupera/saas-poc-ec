export class UnauthenticatedError extends Error {
  override readonly name = 'UnauthenticatedError'
}
export class ForbiddenError extends Error {
  override readonly name = 'ForbiddenError'
}
