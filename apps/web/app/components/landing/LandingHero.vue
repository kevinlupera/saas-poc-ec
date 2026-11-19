<script setup lang="ts">
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Clock,
  Shield,
  Star,
  MessageCircle,
} from 'lucide-vue-next'
</script>

<template>
  <section class="relative overflow-hidden py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-background via-muted/20 to-background">
    <!-- Background glow effect using semantic tokens -->
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/5 blur-3xl rounded-full pointer-events-none -z-10"
      aria-hidden="true"
    />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        <!-- Left Column: Copy & CTAs -->
        <div class="lg:col-span-7 flex flex-col items-start text-left space-y-6">
          <Badge variant="secondary" class="gap-1.5 px-3 py-1 text-xs sm:text-sm rounded-full font-medium">
            <Sparkles class="h-3.5 w-3.5 text-primary" />
            SaaS de agendamiento multi-tenant · Ecuador
          </Badge>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Publica tu página de reservas en
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              10 minutos
            </span>
          </h1>

          <p class="text-lg sm:text-xl text-muted-foreground max-w-2xl font-normal leading-relaxed">
            La plataforma para barberías, consultorios médicos, spas y academias.
            Tus clientes reservan 24/7 sin llamadas, con disponibilidad real en milisegundos
            y recordatorios automáticos por WhatsApp.
          </p>

          <!-- Key value bullets -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground/90 w-full pt-1">
            <div class="flex items-center gap-2">
              <CheckCircle2 class="h-4 w-4 text-primary shrink-0" />
              <span>Registro sin tarjeta de crédito</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircle2 class="h-4 w-4 text-primary shrink-0" />
              <span>Tu link propio <code class="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">/b/tu-negocio</code></span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircle2 class="h-4 w-4 text-primary shrink-0" />
              <span>Cero solapamientos ni dobles reservas</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircle2 class="h-4 w-4 text-primary shrink-0" />
              <span>Recordatorios WhatsApp & ICS de calendario</span>
            </div>
          </div>

          <!-- CTAs -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 w-full sm:w-auto">
            <Button
              size="lg"
              as="a"
              href="#registro"
              class="gap-2 text-base font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Empezar gratis
              <ArrowRight class="h-4 w-4" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              as="a"
              href="#verticales"
              class="text-base font-medium"
            >
              Explorar plantillas
            </Button>
          </div>

          <p class="text-xs text-muted-foreground">
            Plan Free incluye hasta 20 citas/mes y página pública. No caduca.
          </p>
        </div>

        <!-- Right Column: Interactive Mock Preview of /b/tu-negocio -->
        <div class="lg:col-span-5 relative w-full">
          <div class="relative mx-auto max-w-md rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xl">
            <!-- Mock Browser top bar -->
            <div class="flex items-center gap-2 pb-4 mb-4 border-b border-border/60">
              <div class="flex gap-1.5">
                <div class="w-3 h-3 rounded-full bg-destructive/60" />
                <div class="w-3 h-3 rounded-full bg-amber-400/60" />
                <div class="w-3 h-3 rounded-full bg-emerald-400/60" />
              </div>
              <div class="flex-1 text-center">
                <span class="inline-block bg-muted text-[11px] text-muted-foreground px-3 py-1 rounded-md font-mono truncate max-w-[200px]">
                  citas.ec/b/barberia-central
                </span>
              </div>
            </div>

            <!-- Booking Card Header -->
            <div class="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 class="font-bold text-base text-foreground">Barbería Central Guayaquil</h3>
                <p class="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock class="h-3 w-3" /> Lun–Sáb 09:00–19:00 · Urdesa Central
                </p>
              </div>
              <Badge variant="outline" class="gap-1 text-xs shrink-0">
                <Star class="h-3 w-3 fill-amber-400 text-amber-400" />
                4.9 (128)
              </Badge>
            </div>

            <!-- Service Item Mock -->
            <div class="rounded-lg border border-primary/30 bg-primary/5 p-3.5 mb-3 flex items-center justify-between">
              <div>
                <div class="font-semibold text-sm text-foreground">Corte Fade Clásico + Barba</div>
                <div class="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>45 min</span>
                  <span>•</span>
                  <span class="text-primary font-bold">$18.00 USD</span>
                </div>
              </div>
              <Badge variant="default" class="text-[11px]">Seleccionado</Badge>
            </div>

            <!-- Slot Picker Mock -->
            <div class="space-y-2 mb-4">
              <div class="flex items-center justify-between text-xs text-muted-foreground">
                <span class="font-medium text-foreground">Horarios disponibles para hoy:</span>
                <span>Zona: Guayaquil (GMT-5)</span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <button type="button" class="py-2 text-xs font-semibold rounded-md bg-muted text-muted-foreground hover:bg-muted/80">
                  10:30 AM
                </button>
                <button type="button" class="py-2 text-xs font-semibold rounded-md bg-primary text-primary-foreground shadow-sm">
                  11:15 AM
                </button>
                <button type="button" class="py-2 text-xs font-semibold rounded-md bg-muted text-muted-foreground hover:bg-muted/80">
                  03:00 PM
                </button>
              </div>
            </div>

            <!-- WhatsApp confirmation badge floating simulation -->
            <div class="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2.5">
              <div class="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <MessageCircle class="h-4 w-4" />
              </div>
              <div class="text-xs text-foreground leading-tight">
                <span class="font-bold text-emerald-600 dark:text-emerald-400">WhatsApp inmediato:</span>
                "¡Cita confirmada para las 11:15 AM! Ver detalles y cómo llegar."
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
