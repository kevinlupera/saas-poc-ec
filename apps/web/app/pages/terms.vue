<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Términos del servicio | CitasSaaS' })
</script>

<template>
  <article class="space-y-6 text-sm leading-relaxed">
    <header class="space-y-3">
      <Badge variant="outline">Borrador · Pendiente de revisión</Badge>
      <h1 class="text-2xl font-bold tracking-tight">Términos del servicio</h1>
      <p class="text-muted-foreground">Esta página está en preparación. No contiene términos definitivos ni constituye una aceptación contractual.</p>
    </header>
    <section class="space-y-2">
      <h2 class="font-semibold">Antes del lanzamiento</h2>
      <p class="text-muted-foreground">Se deben definir y revisar las condiciones de uso, la identidad del prestador, el alcance del servicio, las responsabilidades y las condiciones de contratación que correspondan.</p>
    </section>
    <section class="space-y-2">
      <h2 class="font-semibold">Versión en desarrollo</h2>
      <p class="text-muted-foreground">Las pantallas de acceso se están preparando para su integración con la API. Ver una pantalla o enviar un formulario no confirma por sí solo la creación de una cuenta o la disponibilidad del servicio.</p>
    </section>
    <nav aria-label="Información relacionada" class="flex flex-wrap gap-x-5 gap-y-3 border-t border-border pt-4 text-primary underline-offset-4">
      <NuxtLink to="/privacy" class="hover:underline">Privacidad</NuxtLink>
      <NuxtLink to="/support" class="hover:underline">Ayuda de acceso</NuxtLink>
    </nav>
  </article>
</template>
