import { createWebAuthClient } from '../utils/auth-client'

export default defineNuxtPlugin(() => ({
  provide: { auth: createWebAuthClient(useRuntimeConfig().public.apiBase) },
}))
