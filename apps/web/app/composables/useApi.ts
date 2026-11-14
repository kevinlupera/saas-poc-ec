// useFetch against the API (apps/api) using `$api` (baseURL + cookies).
// Keeps useFetch's signature: the response is inferred from Nitro routes
// (see `typescript.tsConfig` in nuxt.config.ts). Nuxt "custom useFetch" pattern.
type UseFetchArgs = Parameters<typeof useFetch>

export const useApi = ((url: UseFetchArgs[0], opts?: UseFetchArgs[1]) =>
  useFetch(url, Object.assign({}, opts, { $fetch: useNuxtApp().$api }))) as typeof useFetch
