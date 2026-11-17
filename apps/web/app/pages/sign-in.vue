<script setup lang="ts">
const auth = useAuthClient()

// An OAuth flow (e.g. an MCP client) arrives with a signed query. It assumes an existing account.
const inOAuthFlow = import.meta.client && new URLSearchParams(location.search).has('sig')
const mode = ref<'in' | 'up'>('in')
const form = reactive({ name: '', business: '', email: '', password: '' })
const error = ref('')
const busy = ref(false)

/** Where to go next: the OAuth continuation if the server returned one, else home. */
function proceed(data: unknown) {
  const url = (data as { url?: string } | null)?.url
  if (url) window.location.href = url
  else navigateTo('/')
}

async function submit() {
  error.value = ''
  busy.value = true
  try {
    if (mode.value === 'in') {
      const res = await auth.signIn.email({ email: form.email, password: form.password })
      if (res.error) return void (error.value = res.error.message ?? 'Sign in failed')
      return proceed(res.data)
    }
    const res = await auth.signUp.email({ email: form.email, password: form.password, name: form.name })
    if (res.error) return void (error.value = res.error.message ?? 'Sign up failed')
    // The new business is the tenant (organization) this user owns.
    const slug = `${form.business.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Math.random().toString(36).slice(2, 6)}`
    const org = await auth.organization.create({ name: form.business, slug })
    if (org.error) return void (error.value = org.error.message ?? 'Could not create the business')
    await auth.organization.setActive({ organizationId: org.data.id })
    navigateTo('/')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
    <form class="w-full max-w-sm flex flex-col gap-4" @submit.prevent="submit">
      <h1 class="text-2xl font-bold tracking-tight">{{ mode === 'in' ? 'Sign in' : 'Create your business' }}</h1>

      <template v-if="mode === 'up'">
        <label class="flex flex-col gap-1 text-sm">
          Your name
          <input v-model="form.name" required class="rounded-md border border-input bg-background px-3 py-2" />
        </label>
        <label class="flex flex-col gap-1 text-sm">
          Business name
          <input v-model="form.business" required class="rounded-md border border-input bg-background px-3 py-2" />
        </label>
      </template>

      <label class="flex flex-col gap-1 text-sm">
        Email
        <input v-model="form.email" type="email" autocomplete="email" required class="rounded-md border border-input bg-background px-3 py-2" />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        Password
        <input
          v-model="form.password"
          type="password"
          minlength="8"
          :autocomplete="mode === 'in' ? 'current-password' : 'new-password'"
          required
          class="rounded-md border border-input bg-background px-3 py-2"
        />
      </label>

      <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>

      <Button type="submit" :disabled="busy">{{ mode === 'in' ? 'Sign in' : 'Create account' }}</Button>
      <button
        v-if="!inOAuthFlow"
        type="button"
        class="text-sm text-muted-foreground underline"
        @click="mode = mode === 'in' ? 'up' : 'in'"
      >
        {{ mode === 'in' ? 'New here? Create a business' : 'Have an account? Sign in' }}
      </button>
    </form>
  </main>
</template>
