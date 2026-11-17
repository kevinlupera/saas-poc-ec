import { defineNuxtConfig } from 'nuxt/config'
import { createResolver } from '@nuxt/kit'
import type {} from '@nuxtjs/tailwindcss'

const { resolve } = createResolver(import.meta.url)

// Nuxt layer (https://nuxt.com/docs/guide/going-further/layers).
// Extended by apps/web via `extends: ['@saas/ui']`.
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  components: [
    {
      path: resolve('./app/components/ui'),
      pathPrefix: false,
      extensions: ['.vue'],
    },
    {
      path: resolve('./app/components'),
      pathPrefix: false,
      extensions: ['.vue'],
    },
  ],
  hooks: {
    'components:extend'(components) {
      for (const comp of [...components]) {
        if (comp.filePath.includes('/components/ui/')) {
          const stripped = comp.pascalName.replace(/^Ui/, '')
          if (stripped && stripped !== comp.pascalName) {
            components.push({
              ...comp,
              pascalName: stripped,
              kebabName: stripped.toLowerCase(),
            })
          } else if (stripped) {
            components.push({
              ...comp,
              pascalName: `Ui${stripped}`,
              kebabName: `ui-${stripped.toLowerCase()}`,
            })
          }
        }
      }
    },
  },
  css: [resolve('./app/assets/css/tokens.css')],
  tailwindcss: {
    cssPath: resolve('./app/assets/css/tokens.css'),
    configPath: resolve('./tailwind.config.ts'),
    exposeConfig: true,
    viewer: false,
  },
})
