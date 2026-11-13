// CORS only for the web origin. Preflight requests end here.
export default defineEventHandler((event) => {
  const { webOrigin } = useRuntimeConfig(event)
  const handled = handleCors(event, {
    origin: [webOrigin],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    preflight: { statusCode: 204 },
  })
  if (handled) return true
})
