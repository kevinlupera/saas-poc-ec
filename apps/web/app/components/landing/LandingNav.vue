<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Calendar,
  Moon,
  Sun,
  Menu,
  X,
  Sparkles,
} from 'lucide-vue-next'
import { useTheme } from '../../composables/useTheme'

const { isDark, toggleTheme, initTheme } = useTheme()
const isMobileMenuOpen = ref(false)

onMounted(() => {
  initTheme()
})

const navLinks = [
  { label: 'Plantillas', href: '#verticales' },
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Precios', href: '#precios' },
  { label: 'Preguntas', href: '#faq' },
]
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Logo -->
      <a href="#" class="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
          <Calendar class="h-5 w-5" />
        </div>
        <div class="flex flex-col leading-tight">
          <span class="font-extrabold text-foreground">Citas<span class="text-primary/70">SaaS</span></span>
          <span class="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Ecuador</span>
        </div>
      </a>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          class="text-muted-foreground hover:text-foreground transition-colors"
        >
          {{ link.label }}
        </a>
      </nav>

      <!-- Right CTAs & Theme Toggle -->
      <div class="hidden md:flex items-center gap-3">
        <button
          type="button"
          @click="toggleTheme"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
        >
          <Sun v-if="isDark" class="h-4 w-4 text-amber-400" />
          <Moon v-else class="h-4 w-4 text-slate-700" />
        </button>

        <Button variant="ghost" size="sm" as="a" href="#login">
          Iniciar sesión
        </Button>
        <Button variant="default" size="sm" as="a" href="#registro" class="gap-1.5 shadow-sm">
          <Sparkles class="h-3.5 w-3.5" />
          Empezar gratis
        </Button>
      </div>

      <!-- Mobile Menu Button -->
      <div class="flex md:hidden items-center gap-2">
        <button
          type="button"
          @click="toggleTheme"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground"
          :aria-label="isDark ? 'Modo claro' : 'Modo oscuro'"
        >
          <Sun v-if="isDark" class="h-4 w-4 text-amber-400" />
          <Moon v-else class="h-4 w-4 text-slate-700" />
        </button>

        <button
          type="button"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground"
          :aria-expanded="isMobileMenuOpen"
          aria-label="Abrir menú"
        >
          <X v-if="isMobileMenuOpen" class="h-5 w-5" />
          <Menu v-else class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Mobile dropdown menu -->
    <div
      v-if="isMobileMenuOpen"
      class="md:hidden border-b border-border bg-background px-4 pt-2 pb-6 space-y-4 animate-in slide-in-from-top-2"
    >
      <nav class="flex flex-col space-y-3 pt-2">
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          @click="isMobileMenuOpen = false"
          class="text-base font-medium text-muted-foreground hover:text-foreground py-1"
        >
          {{ link.label }}
        </a>
      </nav>
      <div class="pt-4 border-t border-border flex flex-col gap-2">
        <Button variant="outline" class="w-full justify-center" as="a" href="#login">
          Iniciar sesión
        </Button>
        <Button variant="default" class="w-full justify-center gap-2" as="a" href="#registro">
          <Sparkles class="h-4 w-4" />
          Empezar gratis sin tarjeta
        </Button>
      </div>
    </div>
  </header>
</template>
