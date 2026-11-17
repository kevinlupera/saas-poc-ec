import { requirePrincipal } from '../utils/principal'

export default defineEventHandler((event) => requirePrincipal(event.headers, useRuntimeConfig(event)))
