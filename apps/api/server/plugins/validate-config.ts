import { parseConfig } from '../utils/container'

// Fail fast at boot instead of on the first request.
export default defineNitroPlugin(() => {
  parseConfig(useRuntimeConfig())
})
