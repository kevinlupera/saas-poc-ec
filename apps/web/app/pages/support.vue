<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Ayuda de acceso | CitasSaaS' })
</script>

<template>
  <article class="space-y-6 text-sm leading-relaxed">
    <header class="space-y-2">
      <h1 class="text-2xl font-bold tracking-tight">Ayuda de acceso</h1>
      <p class="text-muted-foreground">Encuentra el siguiente paso para entrar a tu cuenta.</p>
    </header>
    <section class="space-y-2">
      <h2 class="font-semibold">¿Ya tienes cuenta?</h2>
      <p class="text-muted-foreground">Puedes <NuxtLink to="/login" class="text-primary underline">iniciar sesión</NuxtLink> con email y contraseña o continuar con Google. Si aún no tienes una cuenta, ve a <NuxtLink to="/registro" class="text-primary underline">registro</NuxtLink>.</p>
    </section>
    <section class="space-y-2">
      <h2 class="font-semibold">¿Olvidaste tu contraseña?</h2>
      <p class="text-muted-foreground">Solicita un enlace en <NuxtLink to="/recuperar-contrasena" class="text-primary underline">recuperar contraseña</NuxtLink>. Si tienes un enlace vencido, solicita uno nuevo. Nunca compartas tu contraseña ni el enlace de recuperación.</p>
    </section>
    <section class="space-y-2">
      <h2 class="font-semibold">¿Falta verificar tu email?</h2>
      <p class="text-muted-foreground">Revisa tu bandeja de entrada y correo no deseado. Puedes <NuxtLink to="/verificar-email" class="text-primary underline">solicitar otra verificación</NuxtLink> y después volver a iniciar sesión.</p>
    </section>
    <section class="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
      <h2 class="font-semibold">Integración en desarrollo</h2>
      <p class="text-muted-foreground">Los formularios requieren una API de autenticación configurada. Si el servicio no está disponible, mostrarán un error y permitirán reintentar; no confirmarán acceso ni envío de emails sin respuesta del servidor. Google requiere también la configuración del proveedor en el backend.</p>
    </section>
  </article>
</template>
