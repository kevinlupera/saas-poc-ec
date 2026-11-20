<script setup lang="ts">
import { onMounted } from 'vue'
import { ArrowLeft, Calendar, Moon, Sun } from 'lucide-vue-next'
import { useTheme } from '../composables/useTheme'

const { isDark, toggleTheme, initTheme } = useTheme()

onMounted(initTheme)
</script>

<template>
  <div class="relative isolate flex min-h-dvh min-w-0 flex-col bg-background text-foreground">
    <div
      class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-muted/30"
      aria-hidden="true"
    />

    <header class="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 sm:py-6">
      <NuxtLink
        to="/"
        aria-label="CitasSaaS, ir al inicio"
        class="inline-flex min-w-0 items-center gap-2.5 rounded-lg font-bold tracking-tight transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Calendar class="h-5 w-5" aria-hidden="true" />
        </span>
        <span class="flex flex-col leading-tight">
          <span class="text-lg font-extrabold">Citas<span class="text-primary/70">SaaS</span></span>
          <span class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Ecuador</span>
        </span>
      </NuxtLink>

      <Button
        type="button"
        variant="outline"
        size="icon"
        class="shrink-0 bg-background"
        :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
        @click="toggleTheme"
      >
        <Sun v-if="isDark" class="h-4 w-4" aria-hidden="true" />
        <Moon v-else class="h-4 w-4" aria-hidden="true" />
      </Button>
    </header>

    <main class="flex w-full min-w-0 flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div class="w-full min-w-0 max-w-md space-y-6">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          Volver al inicio
        </NuxtLink>

        <Card class="min-w-0 p-5 shadow-lg shadow-primary/5 sm:p-8">
          <div v-if="$slots.header" class="mb-6 space-y-2">
            <slot name="header" />
          </div>
          <slot />
          <div v-if="$slots.footer" class="mt-6 border-t border-border pt-6 text-sm text-muted-foreground">
            <slot name="footer" />
          </div>
        </Card>

        <p class="text-center text-xs leading-relaxed text-muted-foreground">
          Tu tiempo, mejor organizado.
        </p>
      </div>
    </main>

    <footer class="px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
      CitasSaaS · Agendamiento para tu negocio
    </footer>
  </div>
</template>
