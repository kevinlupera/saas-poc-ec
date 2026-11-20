<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Iniciar sesión | CitasSaaS' })
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2"><h1 class="text-2xl font-bold tracking-tight">Qué bueno verte de nuevo</h1><p class="text-sm text-muted-foreground">Inicia sesión para continuar con tu negocio.</p></header>
    <AuthCredentials />
  </div>
</template>
