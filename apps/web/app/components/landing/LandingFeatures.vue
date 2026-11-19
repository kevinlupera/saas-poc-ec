<script setup lang="ts">
import {
  Clock,
  MessageSquare,
  Globe,
  Calendar,
  ShieldCheck,
  QrCode,
  Zap,
} from 'lucide-vue-next'
import { FEATURES } from '../../data/landing'

function getFeatureIcon(iconName: string) {
  switch (iconName) {
    case 'Clock':
      return Clock
    case 'MessageSquare':
      return MessageSquare
    case 'Globe':
      return Globe
    case 'Calendar':
      return Calendar
    case 'ShieldCheck':
      return ShieldCheck
    case 'QrCode':
      return QrCode
    default:
      return Zap
  }
}
</script>

<template>
  <section id="funcionalidades" class="py-20 bg-background">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <Badge variant="outline" class="gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-semibold">
          <Zap class="h-3.5 w-3.5 text-primary" />
          Características del Sistema
        </Badge>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Todo para operar con máxima puntualidad
        </h2>
        <p class="text-muted-foreground text-base sm:text-lg">
          Olvídate de responder mensajes a medianoche. Tu agenda se actualiza sola,
          notifica a tus clientes y te ahorra horas de coordinación manual cada semana.
        </p>
      </div>

      <!-- Feature Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <Card
          v-for="feat in FEATURES"
          :key="feat.title"
          class="p-6 border-border/80 hover:border-primary/40 transition-all hover:shadow-md flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <component :is="getFeatureIcon(feat.icon)" class="h-5 w-5" />
              </div>
              <Badge v-if="feat.badge" variant="secondary" class="text-[11px] font-normal">
                {{ feat.badge }}
              </Badge>
            </div>
            <h3 class="text-lg font-bold text-foreground mb-2">
              {{ feat.title }}
            </h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              {{ feat.description }}
            </p>
          </div>
        </Card>
      </div>
    </div>
  </section>
</template>
