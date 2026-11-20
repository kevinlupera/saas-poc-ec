<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Crear cuenta | CitasSaaS' })
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2"><h1 class="text-2xl font-bold tracking-tight">Empieza con tu cuenta</h1><p class="text-sm text-muted-foreground">Tu próximo paso para organizar mejor tus citas. Sin tarjeta de crédito.</p></header>
    <AuthCredentials register />
  </div>
</template>
