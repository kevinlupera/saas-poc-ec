<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Nueva contraseña | CitasSaaS' })
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2"><h1 class="text-2xl font-bold tracking-tight">Elige una nueva contraseña</h1><p class="text-sm text-muted-foreground">Usa una contraseña única para proteger tu cuenta.</p></header>
    <AuthResetPassword />
  </div>
</template>
