import { createAuthClient } from 'better-auth/vue'

// Instantiated by Nuxt's client plugin, never at module import/prerender time.
export function createWebAuthClient(apiBase: string) {
  return createAuthClient({
    baseURL: apiBase.replace(/\/+$/, ''),
    basePath: '/api/auth',
    fetchOptions: { credentials: 'include', retry: 0, timeout: 10_000 },
  })
}

export type WebAuthClient = ReturnType<typeof createWebAuthClient>
