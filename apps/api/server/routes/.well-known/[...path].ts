// RFC 8414 puts discovery metadata at the host root (`/.well-known/<name>[/<issuer-path>]`);
// Better Auth serves it under its base path. Forward the document name only.
export default defineEventHandler((event) => {
  const name = getRouterParam(event, 'path')?.split('/')[0]
  if (!name) throw createError({ statusCode: 404 })
  const url = new URL(toWebRequest(event).url)
  url.pathname = `/api/auth/.well-known/${name}`
  return useContainer(event).auth.handler(new Request(url, { method: event.method, headers: event.headers }))
})
