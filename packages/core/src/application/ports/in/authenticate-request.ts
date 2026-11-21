import type { Principal } from '../../../domain/principal.ts'

/** Driving port: used by HTTP/MCP adapters. Rejects with `UnauthenticatedError`. */
export type AuthenticateRequest = (headers: Headers) => Promise<Principal>
