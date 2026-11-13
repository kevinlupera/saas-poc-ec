// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  build: { transpile: ['@saas/shared'] },
  runtimeConfig: {
    public: {
      // Override with NUXT_PUBLIC_API_BASE.
      apiBase: 'http://localhost:3001',
    },
  },
})
