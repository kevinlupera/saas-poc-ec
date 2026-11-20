<script setup lang="ts">
import { Sparkles, ArrowRight, MessageCircle } from 'lucide-vue-next'
</script>

<template>
  <section class="py-20 bg-background border-t border-border/50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 lg:p-16 shadow-2xl">
        <!-- Glow pattern -->
        <div
          class="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        <div class="relative z-10 max-w-3xl space-y-6">
          <Badge class="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 border-none gap-1.5 px-3 py-1 text-xs font-semibold">
            <Sparkles class="h-3.5 w-3.5" />
            Configuración en 10 minutos
          </Badge>

          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Comienza hoy mismo a recibir citas de forma profesional
          </h2>

          <p class="text-base sm:text-lg text-primary-foreground/80 leading-relaxed font-normal">
            Únete a barberías, consultorios, spas y centros de entrenamiento que ya automatizan
            sus reservas sin depender de llamadas ni chats manuales.
          </p>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <Button
              size="lg"
              variant="secondary"
              as-child
              class="gap-2 whitespace-normal text-center font-bold shadow-md hover:bg-secondary/90 text-foreground"
            >
              <NuxtLink to="/registro">
                Crear cuenta gratis sin tarjeta
                <ArrowRight class="h-4 w-4 shrink-0" />
              </NuxtLink>
            </Button>

            <Button
              size="lg"
              variant="outline"
              as="a"
              href="#soporte"
              class="gap-2 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <MessageCircle class="h-4 w-4" />
              Hablar con soporte
            </Button>
          </div>

          <p class="text-xs text-primary-foreground/60 pt-2">
            Plan Free sin costo. Configura tus servicios y comparte tu link hoy mismo.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
