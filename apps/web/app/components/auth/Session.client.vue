<script setup lang="ts">
import { LoaderCircle, CheckCircle2 } from 'lucide-vue-next'
const auth = useAuth()
const session = auth.useSession()
const { pending, error, run } = useAuthAction()
async function signOut() {
  await run(async () => {
    const result = await auth.signOut()
    if (result.error) throw result.error
    await session.value.refetch()
    await navigateTo('/login')
  })
}
</script>

<template>
  <div class="space-y-5">
    <div v-if="session.isPending" role="status" class="flex items-center gap-2 text-sm text-muted-foreground">
      <LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" /> Comprobando tu sesión…
    </div>
    <template v-else-if="session.error">
      <AuthMessage error>No pudimos comprobar tu sesión. Comprueba tu conexión e inténtalo de nuevo.</AuthMessage>
      <Button class="w-full" :disabled="session.isRefetching" @click="session.refetch()">Reintentar</Button>
    </template>
    <template v-else-if="session.data?.session && session.data?.user">
      <div class="flex items-center gap-2 font-medium"><CheckCircle2 class="h-5 w-5 text-primary" aria-hidden="true" /> Sesión iniciada</div>
      <p class="text-sm text-muted-foreground">Hola, <span class="text-foreground">{{ session.data.user.name }}</span>.</p>
      <p class="break-all text-sm">{{ session.data.user.email }}</p>
      <p class="text-sm text-muted-foreground">Tu acceso está confirmado. El panel del negocio estará disponible más adelante.</p>
      <AuthMessage v-if="error" error>{{ error }}</AuthMessage>
      <Button class="w-full" variant="outline" :disabled="pending" @click="signOut">{{ pending ? 'Cerrando sesión…' : 'Cerrar sesión' }}</Button>
    </template>
    <template v-else>
      <AuthMessage>No hay una sesión activa. Inicia sesión para continuar.</AuthMessage>
      <Button as-child class="w-full"><NuxtLink to="/login">Ir a iniciar sesión</NuxtLink></Button>
    </template>
    <NuxtLink to="/" class="block text-center text-sm text-primary hover:underline">Volver al inicio</NuxtLink>
  </div>
</template>
