<script setup lang="ts">
const auth = useAuthClient()
const route = useRoute()

// The server redirects here with `client_id` and `scope`. The consent call below sends the
// signed `oauth_query` (via oauthProviderClient), so the server rejects any tampered request.
const clientId = String(route.query.client_id ?? '')
const scopes = String(route.query.scope ?? '').split(' ').filter(Boolean)
const error = ref('')
const busy = ref(false)

async function decide(accept: boolean) {
  error.value = ''
  busy.value = true
  try {
    const res = await auth.oauth2.consent({ accept })
    if (res.error) return void (error.value = res.error.message ?? 'Could not complete the request')
    const url = (res.data as { url?: string } | null)?.url
    if (url) window.location.href = url
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
    <section class="w-full max-w-sm flex flex-col gap-4">
      <h1 class="text-2xl font-bold tracking-tight">Authorize access</h1>
      <p class="text-sm text-muted-foreground">
        The application <strong class="text-foreground">{{ clientId || 'unknown' }}</strong> wants to access your account with:
      </p>
      <ul class="list-disc pl-5 text-sm">
        <li v-for="scope in scopes" :key="scope">{{ scope }}</li>
      </ul>
      <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
      <div class="flex gap-3">
        <Button :disabled="busy" @click="decide(true)">Allow</Button>
        <Button variant="outline" :disabled="busy" @click="decide(false)">Deny</Button>
      </div>
    </section>
  </main>
</template>
