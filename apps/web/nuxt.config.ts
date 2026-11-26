import { themeInitScript } from './scripts/theme-init'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  // Shared UI layer (packages/ui).
  extends: ['@saas/ui'],
  devtools: { enabled: true },
  app: {
    head: {
      meta: [{ name: 'referrer', content: 'no-referrer' }],
      script: [{
        key: 'theme-init',
        tagPosition: 'head',
        tagPriority: 'critical',
        innerHTML: themeInitScript,
      }],
    },
  },
  build: { transpile: ['@saas/shared'] },
  nitro: {
    prerender: {
      routes: ['/login', '/registro', '/recuperar-contrasena', '/restablecer-contrasena', '/verificar-email', '/auth/complete'],
    },
  },
  // Auth pages depend on the browser URL/session: render client-side only.
  routeRules: {
    '/consent': { ssr: false },
  },
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
