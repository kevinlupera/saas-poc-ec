<script setup lang="ts">
import { ArrowRight, Sparkles } from 'lucide-vue-next'
import { HOW_IT_WORKS } from '../../data/landing'
</script>

<template>
  <section id="como-funciona" class="py-20 bg-muted/20 border-t border-border/50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <Badge variant="outline" class="gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-semibold">
          <Sparkles class="h-3.5 w-3.5 text-primary" />
          Puesta en Marcha Rápida
        </Badge>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Listo para recibir citas en 3 pasos
        </h2>
        <p class="text-muted-foreground text-base sm:text-lg">
          Sin configuraciones complejas ni código. En menos de 10 minutos tu link está listo para compartir.
        </p>
      </div>

      <!-- Steps Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        <div
          v-for="(step, index) in HOW_IT_WORKS"
          :key="step.step"
          class="relative flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card shadow-sm"
        >
          <div class="h-12 w-12 rounded-full bg-primary text-primary-foreground font-black text-lg flex items-center justify-center mb-4 shadow">
            {{ step.step }}
          </div>
          <h3 class="text-lg font-bold text-foreground mb-2">
            {{ step.title }}
          </h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            {{ step.description }}
          </p>

          <!-- Desktop step arrow connector -->
          <div
            v-if="index < HOW_IT_WORKS.length - 1"
            class="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground/50"
            aria-hidden="true"
          >
            <ArrowRight class="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
