<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Verificar email | CitasSaaS' })
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2"><h1 class="text-2xl font-bold tracking-tight">Revisa tu email</h1><p class="text-sm text-muted-foreground">Verificar tu email ayuda a mantener tu cuenta segura.</p></header>
    <AuthEmailRequest verify />
  </div>
</template>
