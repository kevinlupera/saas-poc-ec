<script setup lang="ts">
import { ref } from 'vue'
import { Check, Sparkles, Tag, Users, Calendar, MessageSquare, Percent } from 'lucide-vue-next'
import { PRICING_PLANS } from '../../data/landing'

const isAnnual = ref(false)
</script>

<template>
  <section id="precios" class="py-20 bg-background border-t border-border/50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center max-w-3xl mx-auto space-y-4 mb-12">
        <Badge variant="outline" class="gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-semibold">
          <Tag class="h-3.5 w-3.5 text-primary" />
          Planes y Precios
        </Badge>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Precios claros, sin costos ocultos
        </h2>
        <p class="text-muted-foreground text-base sm:text-lg">
          Comienza gratis y escala cuando tu equipo crezca. Sin compromiso ni contratos a largo plazo.
        </p>

        <!-- Billing Period Toggle -->
        <div class="inline-flex items-center gap-3 p-1 rounded-full border border-border bg-muted/50 mt-6 shadow-inner">
          <button
            type="button"
            @click="isAnnual = false"
            :class="[
              'px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all',
              !isAnnual
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ]"
          >
            Facturación Mensual
          </button>
          <button
            type="button"
            @click="isAnnual = true"
            :class="[
              'px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5',
              isAnnual
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ]"
          >
            <span>Facturación Anual</span>
            <span
              :class="[
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                isAnnual ? 'bg-background/20 text-primary-foreground' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              ]"
            >
              2 meses gratis
            </span>
          </button>
        </div>
      </div>

      <!-- Pricing Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        <Card
          v-for="plan in PRICING_PLANS"
          :key="plan.id"
          :class="[
            'p-6 flex flex-col justify-between transition-all relative',
            plan.popular
              ? 'border-2 border-primary shadow-xl bg-card ring-1 ring-primary/20'
              : 'border-border/80 bg-card hover:border-border hover:shadow-md',
          ]"
        >
          <!-- Popular Badge -->
          <div
            v-if="plan.popular"
            class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full shadow"
          >
            Recomendado
          </div>

          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="text-xl font-bold text-foreground">
                {{ plan.name }}
              </h3>
              <Badge v-if="plan.badge && !plan.popular" variant="secondary" class="text-[10px]">
                {{ plan.badge }}
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground mb-6 min-h-[32px]">
              {{ plan.description }}
            </p>

            <!-- Price Display -->
            <div class="mb-6 pb-6 border-b border-border">
              <div class="flex items-baseline gap-1">
                <span class="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  ${{ isAnnual ? plan.annualPrice : plan.monthlyPrice }}
                </span>
                <span class="text-xs text-muted-foreground font-medium">/ mes</span>
              </div>
              <p v-if="isAnnual && plan.annualPrice > 0" class="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                ${{ plan.annualPrice * 12 }} cobrado anualmente
                (ahorro {{ ((1 - plan.annualPrice / plan.monthlyPrice) * 100).toLocaleString('es-EC', { maximumFractionDigits: 2 }) }}%)
              </p>
              <p v-else-if="plan.monthlyPrice === 0" class="text-[11px] text-muted-foreground font-medium mt-1">
                Gratis para siempre, sin tarjeta
              </p>
              <p v-else class="text-[11px] text-muted-foreground font-medium mt-1">
                Facturado mes a mes
              </p>
            </div>

            <!-- Limits Checklist Highlight -->
            <div class="rounded-lg bg-muted/40 p-3 mb-6 space-y-2 text-xs">
              <div class="flex items-center gap-2">
                <Users class="h-3.5 w-3.5 text-primary shrink-0" />
                <span class="text-foreground font-medium">{{ plan.limits.staff }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Calendar class="h-3.5 w-3.5 text-primary shrink-0" />
                <span class="text-foreground font-medium">{{ plan.limits.appointments }}</span>
              </div>
              <div class="flex items-center gap-2">
                <MessageSquare class="h-3.5 w-3.5 text-primary shrink-0" />
                <span class="text-foreground font-medium">{{ plan.limits.messaging }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Percent class="h-3.5 w-3.5 text-primary shrink-0" />
                <span class="text-muted-foreground">{{ plan.limits.commission }}</span>
              </div>
            </div>

            <!-- Feature Bullet list -->
            <div class="space-y-2.5 mb-8">
              <p class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Incluye:
              </p>
              <div
                v-for="feat in plan.features"
                :key="feat"
                class="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <Check class="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>{{ feat }}</span>
              </div>
            </div>
          </div>

          <!-- Plan Action CTA -->
          <Button
            :variant="plan.popular ? 'default' : 'outline'"
            as="a"
            href="#registro"
            class="w-full font-semibold shadow-sm"
          >
            {{ plan.ctaText }}
          </Button>
        </Card>
      </div>
    </div>
  </section>
</template>
