<script setup lang="ts">
import { authCallback, emailError, focusFirstError } from '../../utils/auth'
const props = defineProps<{ verify?: boolean }>()
const auth = useAuth()
const session = props.verify ? auth.useSession() : undefined
const route = useRoute()
const { pending, error, run } = useAuthAction()
const email = ref('')
const fieldError = ref('')
const accepted = ref(false)
const form = ref<HTMLFormElement | null>(null)
const verified = computed(() => !!(session?.value.data?.session && session.value.data.user.emailVerified && !session.value.error))
const invalidLink = computed(() => props.verify && typeof route.query.error === 'string')

async function submit() {
  if (pending.value) return
  accepted.value = false
  fieldError.value = emailError(email.value)
  if (fieldError.value) {
    await nextTick()
    focusFirstError(form.value)
    return
  }
  await run(async () => {
    const result = props.verify
      ? await auth.sendVerificationEmail({ email: email.value.trim(), callbackURL: authCallback(window.location.origin, 'verify') })
      : await auth.requestPasswordReset({ email: email.value.trim(), redirectTo: authCallback(window.location.origin, 'reset') })
    if (result.error) throw result.error
    accepted.value = true
  })
}
</script>

<template>
  <div class="space-y-5">
    <AuthMessage v-if="invalidLink" error>El enlace no es válido o ha vencido. Solicita uno nuevo.</AuthMessage>
    <AuthMessage v-else-if="verified">Tu email está verificado.</AuthMessage>
    <p v-if="verify && (!verified || invalidLink)" class="text-sm text-muted-foreground">Abre el enlace de tu correo para verificar tu email. Si ya lo hiciste, puedes intentar iniciar sesión. También puedes solicitar otro enlace aquí.</p>
    <form v-if="!verified || invalidLink" ref="form" novalidate class="space-y-4" :aria-busy="pending" @submit.prevent="submit">
      <AuthField id="email" v-model="email" label="Email" type="email" autocomplete="email" :error="fieldError" :disabled="pending" required />
      <AuthMessage v-if="error" error>{{ error }}</AuthMessage>
      <AuthMessage v-if="accepted">{{ verify ? 'Si la cuenta necesita verificación, recibirás instrucciones en tu email.' : 'Si existe una cuenta, recibirás instrucciones para recuperar tu contraseña.' }}</AuthMessage>
      <Button type="submit" class="w-full" :disabled="pending">{{ pending ? 'Enviando solicitud…' : verify ? 'Reenviar verificación' : 'Enviar enlace de recuperación' }}</Button>
    </form>
    <p class="text-center text-sm"><NuxtLink to="/login" class="text-primary hover:underline">Volver a iniciar sesión</NuxtLink></p>
  </div>
</template>
