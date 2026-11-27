// CORS. Preflight requests end here.
// OAuth discovery, registration and token endpoints are public and cookie-free: browser-based MCP
// clients (MCP Inspector) call them from their own origin. Everything else only for the web origin.
const PUBLIC_OAUTH = /^\/(\.well-known\/|api\/auth\/(oauth2\/(register|token|revoke)|jwks)$)/

export default defineEventHandler((event) => {
  const handled = PUBLIC_OAUTH.test(event.path.split('?')[0]!)
    ? handleCors(event, { origin: '*', methods: ['GET', 'POST', 'OPTIONS'], preflight: { statusCode: 204 } })
    : handleCors(event, {
        origin: [useRuntimeConfig(event).webOrigin],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
        preflight: { statusCode: 204 },
      })
  if (handled) return true
})
