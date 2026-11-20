<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Recuperar contraseña | CitasSaaS' })
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2"><h1 class="text-2xl font-bold tracking-tight">Recupera tu acceso</h1><p class="text-sm text-muted-foreground">Introduce tu email para solicitar instrucciones de recuperación.</p></header>
    <AuthEmailRequest />
  </div>
</template>
