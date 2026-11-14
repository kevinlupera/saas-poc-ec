// `$api`: $fetch pointed at the API (apps/api). Typed by Nitro routes.
export default defineNuxtPlugin(() => {
  const { apiBase } = useRuntimeConfig().public
  const api = $fetch.create({ baseURL: apiBase, credentials: 'include' })
  return { provide: { api } }
})
