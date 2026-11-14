// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  // Shared UI layer (packages/ui).
  extends: ['@saas/ui'],
  devtools: { enabled: true },
  build: { transpile: ['@saas/shared'] },
  runtimeConfig: {
    public: {
      // Override with NUXT_PUBLIC_API_BASE.
      apiBase: 'http://localhost:3001',
    },
  },
  // Route types from apps/api (Nitro regenerates them on `dev`/`prepare`).
  // Lets useFetch/useApi/$api infer each endpoint's response.
  typescript: {
    tsConfig: {
      include: ['../../api/.nitro/types/nitro-routes.d.ts'],
    },
  },
})
