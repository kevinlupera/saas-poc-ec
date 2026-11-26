<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Autorizar acceso | CitasSaaS' })

// The API redirects here with `client_id`, `scope` and its signature. The consent call forwards the
// signed `oauth_query` (oauthProviderClient), so the API rejects any tampered request.
const auth = useAuth()
const route = useRoute()
const { pending, error, run } = useAuthAction()
const clientId = String(route.query.client_id ?? '')
const clientName = ref('')
const SCOPE_LABELS: Record<string, string> = {
  openid: 'Confirmar tu identidad',
  profile: 'Ver tu nombre',
  email: 'Ver tu email',
  offline_access: 'Mantener el acceso sin que vuelvas a iniciar sesión',
}
const scopes = String(route.query.scope ?? '').split(' ').filter(Boolean).map((s) => SCOPE_LABELS[s] ?? s)

onMounted(async () => {
  if (!clientId) return
  const res = await auth.$fetch<{ client_name?: string }>('/oauth2/public-client', { query: { client_id: clientId } })
  clientName.value = res.data?.client_name ?? ''
})

async function decide(accept: boolean) {
  await run(async () => {
    const res = await auth.$fetch<{ redirect?: boolean; url?: string }>('/oauth2/consent', { method: 'POST', body: { accept } })
    if (res.error) throw res.error
    // The API answers `{ redirect: true, url }` with the agent's registered callback (code or
    // access_denied); the auth client follows it.
    if (!res.data?.redirect || !res.data.url) throw new Error('Missing redirect')
  })
}
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2">
      <h1 class="text-2xl font-bold tracking-tight">Autorizar acceso</h1>
      <p class="text-sm text-muted-foreground">
        <strong class="text-foreground break-words">{{ clientName || clientId || 'Una aplicación' }}</strong>
        quiere acceder a tu negocio en CitasSaaS en tu nombre.
      </p>
    </header>
    <section v-if="scopes.length" aria-labelledby="consent-scopes" class="space-y-2">
      <h2 id="consent-scopes" class="text-sm font-medium">Podrá:</h2>
      <ul class="list-disc space-y-1 pl-5 text-sm">
        <li v-for="scope in scopes" :key="scope">{{ scope }}</li>
      </ul>
    </section>
    <AuthMessage v-if="error" error>{{ error }}</AuthMessage>
    <div class="flex flex-col gap-3 sm:flex-row">
      <Button type="button" class="w-full gap-2" :disabled="pending" @click="decide(true)">
        <LoaderCircle v-if="pending" class="h-4 w-4 animate-spin" aria-hidden="true" />
        Permitir
      </Button>
      <Button type="button" variant="outline" class="w-full" :disabled="pending" @click="decide(false)">Rechazar</Button>
    </div>
  </div>
</template>
