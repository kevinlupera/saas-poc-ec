import { oauthProviderClient } from '@better-auth/oauth-provider/client'
import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'

const build = (baseURL: string) =>
  createAuthClient({
    baseURL,
    fetchOptions: { credentials: 'include' },
    // oauthProviderClient forwards the signed `oauth_query` of an OAuth flow to every auth call.
    plugins: [organizationClient(), oauthProviderClient()],
  })

let client: ReturnType<typeof build> | undefined

/** Better Auth client pointed at apps/api. */
export const useAuthClient = () => (client ??= build(useRuntimeConfig().public.apiBase))
