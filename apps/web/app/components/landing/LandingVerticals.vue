<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Scissors,
  Stethoscope,
  Sparkles,
  Users,
  Check,
  ShieldCheck,
  Layers,
} from 'lucide-vue-next'
import { VERTICALS, type VerticalTemplate } from '../../data/landing'

const selectedId = ref<VerticalTemplate['id']>(VERTICALS[0].id)

const currentVertical = computed<VerticalTemplate>(() => {
  return VERTICALS.find((v) => v.id === selectedId.value) ?? VERTICALS[0]
})

function getIcon(iconName: string) {
  switch (iconName) {
    case 'Scissors':
      return Scissors
    case 'Stethoscope':
      return Stethoscope
    case 'Sparkles':
      return Sparkles
    case 'Users':
      return Users
    default:
      return Layers
  }
}
</script>

<template>
  <section id="verticales" class="py-20 bg-muted/30 border-y border-border/50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center max-w-3xl mx-auto space-y-4 mb-12">
        <Badge variant="outline" class="gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-semibold">
          <Layers class="h-3.5 w-3.5 text-primary" />
          Plantillas por Vertical
        </Badge>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Diseñado para tu negocio: configuración, no código
        </h2>
        <p class="text-muted-foreground text-base sm:text-lg">
          No tienes que inventar la rueda. Elige tu tipo de negocio y el sistema precarga
          la terminología exacta, duración de servicios recomendados y reglas de cancelación.
        </p>
      </div>

      <!-- Vertical Tabs -->
      <div class="flex flex-wrap items-center justify-center gap-2 mb-8">
        <button
          v-for="v in VERTICALS"
          :key="v.id"
          type="button"
          @click="selectedId = v.id"
          :class="[
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm',
            selectedId === v.id
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent',
          ]"
        >
          <component :is="getIcon(v.icon)" class="h-4 w-4" />
          <span>{{ v.name }}</span>
        </button>
      </div>

      <!-- Active Vertical Card Display -->
      <div class="max-w-4xl mx-auto">
        <Card class="p-6 sm:p-8 border-border bg-card shadow-lg transition-all">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div class="flex items-center gap-2.5 mb-2">
                <span class="p-2 rounded-md bg-primary/10 text-primary">
                  <component :is="getIcon(currentVertical.icon)" class="h-5 w-5" />
                </span>
                <h3 class="text-xl sm:text-2xl font-bold text-foreground">
                  {{ currentVertical.headline }}
                </h3>
              </div>
              <p class="text-sm text-muted-foreground">
                {{ currentVertical.description }}
              </p>
            </div>
            <Badge variant="secondary" class="self-start md:self-auto text-xs shrink-0 font-medium">
              {{ currentVertical.badge }}
            </Badge>
          </div>

          <!-- Terminology mapping grid -->
          <div class="py-6 border-b border-border">
            <h4 class="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-3">
              Terminología adaptada en la página de reservas:
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="rounded-lg bg-muted/60 p-3">
                <div class="text-[11px] text-muted-foreground">Profesional:</div>
                <div class="font-bold text-sm text-foreground">{{ currentVertical.terminology.staff }}</div>
              </div>
              <div class="rounded-lg bg-muted/60 p-3">
                <div class="text-[11px] text-muted-foreground">Servicio:</div>
                <div class="font-bold text-sm text-foreground">{{ currentVertical.terminology.service }}</div>
              </div>
              <div class="rounded-lg bg-muted/60 p-3">
                <div class="text-[11px] text-muted-foreground">Cliente:</div>
                <div class="font-bold text-sm text-foreground">{{ currentVertical.terminology.customer }}</div>
              </div>
              <div class="rounded-lg bg-muted/60 p-3">
                <div class="text-[11px] text-muted-foreground">Acción:</div>
                <div class="font-bold text-sm text-foreground">{{ currentVertical.terminology.booking }}</div>
              </div>
            </div>
          </div>

          <!-- Services and Policies side by side -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <!-- Sample Services -->
            <div>
              <h4 class="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                <span>Servicios de ejemplo preconfigurados:</span>
              </h4>
              <div class="space-y-2">
                <div
                  v-for="service in currentVertical.sampleServices"
                  :key="service.name"
                  class="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-background text-sm"
                >
                  <span class="font-medium text-foreground">{{ service.name }}</span>
                  <div class="flex items-center gap-2 text-xs">
                    <span class="text-muted-foreground">{{ service.duration }}</span>
                    <span class="font-bold text-primary">{{ service.price }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Policies -->
            <div>
              <h4 class="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                <ShieldCheck class="h-4 w-4 text-primary" />
                <span>Políticas y reglas activas:</span>
              </h4>
              <ul class="space-y-2.5">
                <li
                  v-for="policy in currentVertical.policies"
                  :key="policy"
                  class="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <Check class="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{{ policy }}</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </section>
</template>
