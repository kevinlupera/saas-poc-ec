export default defineEventHandler((event) => useContainer(event).auth.handler(toWebRequest(event)))
