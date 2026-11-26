<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'
import { AUTH_ROUTES, authCallback, emailError, oauthContinuation, passwordError, focusFirstError } from '../../utils/auth'

const props = defineProps<{ register?: boolean }>()
const auth = useAuth()
const { pending, error, errorCode, run } = useAuthAction()
const route = useRoute()
const form = ref<HTMLFormElement | null>(null)
const name = ref('')
const email = ref('')
const password = ref('')
const confirmation = ref('')
const errors = ref<Record<string, string>>({})
// Better Auth appends the provider's own `error` to ours (`?error=oauth&error=access_denied`), so it can be an array.
const providerError = computed(() => route.query.error != null)
const callback = (destination: Parameters<typeof authCallback>[1]) => authCallback(window.location.origin, destination)

async function submit() {
  if (pending.value) return
  errors.value = {
    email: emailError(email.value),
    password: props.register ? passwordError(password.value) : (password.value ? '' : 'Introduce tu contraseña.'),
    ...(props.register ? {
      name: name.value.trim() ? '' : 'Introduce tu nombre.',
      confirmation: confirmation.value === password.value ? '' : 'Las contraseñas no coinciden.',
    } : {}),
  }
  if (Object.values(errors.value).some(Boolean)) {
    await nextTick()
    focusFirstError(form.value)
    return
  }
  await run(async () => {
    const credentials = { email: email.value.trim(), password: password.value }
    const result = props.register
      ? await auth.signUp.email({ ...credentials, name: name.value.trim(), callbackURL: callback('verify') })
      : await auth.signIn.email(credentials)
    if (result.error) throw result.error
    password.value = ''
    confirmation.value = ''
    if (props.register) {
      const session = await auth.getSession({ query: { disableCookieCache: true } })
      // An accepted registration is not proof of a session (synthetic users included).
      if (!session.error && !session.data?.session) {
        await navigateTo('/verificar-email')
        return
      }
      await navigateTo('/auth/complete')
      return
    }
    // An agent's OAuth authorization resumes at the URL the API returned (consent or the agent itself).
    const next = oauthContinuation(window.location.search, result.data)
    if (next === AUTH_ROUTES.complete) await navigateTo(next)
    else window.location.href = next
  })
}

async function google() {
  await run(async () => {
    const result = await auth.signIn.social({
      provider: 'google', callbackURL: callback('complete'), newUserCallbackURL: callback('complete'),
      errorCallbackURL: `${callback('login')}?error=oauth`,
    })
    if (result.error) throw result.error
    if (!result.data?.url || !result.data.redirect) throw new Error('Missing provider redirect')
    // The official client follows the provider URL; no tokens or SDK in this form.
  })
}
</script>

<template>
  <div class="space-y-6">
    <AuthMessage v-if="providerError" error>No pudimos completar el acceso con Google. Puedes reintentar o usar tu email.</AuthMessage>
    <Button type="button" variant="outline" class="w-full gap-2" :disabled="pending" @click="google">
      <span aria-hidden="true" class="text-base font-bold">G</span> Continuar con Google
    </Button>
    <div class="flex items-center gap-3 text-xs text-muted-foreground"><span class="h-px flex-1 bg-border" />o continúa con email<span class="h-px flex-1 bg-border" /></div>
    <form ref="form" class="space-y-4" novalidate :aria-busy="pending" @submit.prevent="submit">
      <AuthField v-if="register" id="name" v-model="name" label="Nombre" autocomplete="name" :error="errors.name" :disabled="pending" required />
      <AuthField id="email" v-model="email" label="Email" type="email" autocomplete="email" :error="errors.email" :disabled="pending" required />
      <AuthField id="password" v-model="password" label="Contraseña" type="password" :autocomplete="register ? 'new-password' : 'current-password'" :hint="register ? 'Entre 8 y 128 caracteres.' : undefined" :error="errors.password" :disabled="pending" required />
      <AuthField v-if="register" id="confirmation" v-model="confirmation" label="Confirmar contraseña" type="password" autocomplete="new-password" :error="errors.confirmation" :disabled="pending" required />
      <div v-if="!register" class="text-right"><NuxtLink to="/recuperar-contrasena" class="text-sm text-primary underline-offset-4 hover:underline">¿Olvidaste tu contraseña?</NuxtLink></div>
      <AuthMessage v-if="error" error>{{ error }}</AuthMessage>
      <NuxtLink v-if="errorCode === 'EMAIL_NOT_VERIFIED'" to="/verificar-email" class="block text-sm text-primary underline">Verificar mi email</NuxtLink>
      <Button type="submit" class="w-full gap-2" :disabled="pending">
        <LoaderCircle v-if="pending" class="h-4 w-4 animate-spin" aria-hidden="true" />
        {{ pending ? 'Conectando…' : register ? 'Crear cuenta' : 'Iniciar sesión' }}
      </Button>
    </form>
    <p class="text-center text-sm text-muted-foreground">
      {{ register ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?' }}
      <NuxtLink :to="register ? '/login' : '/registro'" class="font-medium text-primary underline-offset-4 hover:underline">{{ register ? 'Inicia sesión' : 'Regístrate gratis' }}</NuxtLink>
    </p>
  </div>
</template>
