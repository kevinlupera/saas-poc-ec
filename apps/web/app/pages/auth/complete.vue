<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Tu acceso | CitasSaaS' })
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2"><h1 class="text-2xl font-bold tracking-tight">Tu acceso a CitasSaaS</h1><p class="text-sm text-muted-foreground">Comprobamos tu sesión de forma segura.</p></header>
    <AuthSession />
  </div>
</template>
