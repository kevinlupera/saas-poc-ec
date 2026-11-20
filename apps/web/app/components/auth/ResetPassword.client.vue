<script setup lang="ts">
import { passwordError, focusFirstError } from '../../utils/auth'
const auth = useAuth()
const router = useRouter()
// The initial static hydration temporarily uses a query-free prerender route.
// Read the link only after Nuxt restores the actual browser URL.
const token = ref('')
const initialized = ref(false)
const password = ref('')
const confirmation = ref('')
const errors = ref<Record<string, string>>({})
const done = ref(false)
const form = ref<HTMLFormElement | null>(null)
const { pending, error, run } = useAuthAction()

onNuxtReady(() => {
  const params = new URLSearchParams(window.location.search)
  token.value = !params.has('error') && params.getAll('token').length === 1 ? params.get('token') || '' : ''
  initialized.value = true
  // Capture once, then align router state and history without adding an entry.
  if (params.has('token')) void router.replace({ path: '/restablecer-contrasena' })
})
onBeforeUnmount(() => { token.value = ''; password.value = ''; confirmation.value = '' })

async function submit() {
  if (pending.value || !token.value) return
  errors.value = {
    password: passwordError(password.value),
    confirmation: confirmation.value === password.value ? '' : 'Las contraseñas no coinciden.',
  }
  if (Object.values(errors.value).some(Boolean)) {
    await nextTick()
    focusFirstError(form.value)
    return
  }
  await run(async () => {
    const result = await auth.resetPassword({ token: token.value, newPassword: password.value })
    if (result.error) {
      if (result.error.code === 'INVALID_TOKEN' || result.error.code === 'TOKEN_EXPIRED') token.value = ''
      throw result.error
    }
    token.value = ''
    password.value = ''
    confirmation.value = ''
    done.value = true
  })
}
</script>

<template>
  <div class="space-y-5">
    <p v-if="!initialized" role="status" class="text-sm text-muted-foreground">Preparando el enlace…</p>
    <AuthMessage v-else-if="done">Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña.</AuthMessage>
    <template v-else-if="!token">
      <AuthMessage error>El enlace no es válido o ha vencido. Solicita uno nuevo.</AuthMessage>
      <Button as-child class="w-full"><NuxtLink to="/recuperar-contrasena">Solicitar otro enlace</NuxtLink></Button>
    </template>
    <form v-else ref="form" novalidate class="space-y-4" :aria-busy="pending" @submit.prevent="submit">
      <AuthField id="password" v-model="password" label="Nueva contraseña" type="password" autocomplete="new-password" hint="Entre 8 y 128 caracteres." :error="errors.password" :disabled="pending" required />
      <AuthField id="confirmation" v-model="confirmation" label="Confirmar contraseña" type="password" autocomplete="new-password" :error="errors.confirmation" :disabled="pending" required />
      <AuthMessage v-if="error" error>{{ error }}</AuthMessage>
      <Button type="submit" class="w-full" :disabled="pending">{{ pending ? 'Guardando…' : 'Guardar nueva contraseña' }}</Button>
    </form>
    <p class="text-center text-sm"><NuxtLink to="/login" class="text-primary hover:underline">Volver a iniciar sesión</NuxtLink></p>
  </div>
</template>
