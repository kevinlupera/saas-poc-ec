import { oauthProviderClient } from '@better-auth/oauth-provider/client'
import { createAuthClient } from 'better-auth/vue'

// Instantiated by Nuxt's client plugin, never at module import/prerender time.
export function createWebAuthClient(apiBase: string) {
  return createAuthClient({
    baseURL: apiBase.replace(/\/+$/, ''),
    basePath: '/api/auth',
    fetchOptions: { credentials: 'include', retry: 0, timeout: 10_000 },
    // During an agent's OAuth authorization, forwards the page's signed query (`oauth_query`) so
    // sign-in (email or Google) and consent resume that authorization. No-op on any other page.
    plugins: [oauthProviderClient()],
  })
}

export type WebAuthClient = ReturnType<typeof createWebAuthClient>
