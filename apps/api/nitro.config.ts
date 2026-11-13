import { defineNitroConfig } from 'nitropack/config'

export default defineNitroConfig({
  compatibilityDate: '2025-07-15',
  preset: 'cloudflare_module',
  srcDir: 'server',
  runtimeConfig: {
    // Origin allowed by CORS. Override with NITRO_WEB_ORIGIN.
    webOrigin: 'http://localhost:3000',
  },
})
