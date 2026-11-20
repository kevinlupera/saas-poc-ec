<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Privacidad | CitasSaaS' })
</script>

<template>
  <article class="space-y-6 text-sm leading-relaxed">
    <header class="space-y-3">
      <Badge variant="outline">Borrador · Pendiente de revisión</Badge>
      <h1 class="text-2xl font-bold tracking-tight">Política de privacidad</h1>
      <p class="text-muted-foreground">Esta página no es una política de privacidad definitiva. Su contenido debe completarse y revisarse antes del lanzamiento.</p>
    </header>
    <section class="space-y-2">
      <h2 class="font-semibold">Información pendiente</h2>
      <p class="text-muted-foreground">Falta documentar el responsable del tratamiento, los datos y sus finalidades, las bases legales aplicables, los proveedores, los plazos de conservación y los canales para ejercer derechos.</p>
    </section>
    <section class="space-y-2">
      <h2 class="font-semibold">Revisión necesaria</h2>
      <p class="text-muted-foreground">La versión final deberá reflejar el tratamiento real de datos del producto y la normativa aplicable. Este borrador no acredita cumplimiento de la LOPDP ni sustituye una revisión legal.</p>
    </section>
    <nav aria-label="Información relacionada" class="flex flex-wrap gap-x-5 gap-y-3 border-t border-border pt-4 text-primary underline-offset-4">
      <NuxtLink to="/terms" class="hover:underline">Términos</NuxtLink>
      <NuxtLink to="/support" class="hover:underline">Ayuda de acceso</NuxtLink>
    </nav>
  </article>
</template>
