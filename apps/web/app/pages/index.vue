<script setup lang="ts">
import LandingNav from '../components/landing/LandingNav.vue'
import LandingHero from '../components/landing/LandingHero.vue'
import LandingVerticals from '../components/landing/LandingVerticals.vue'
import LandingFeatures from '../components/landing/LandingFeatures.vue'
import LandingHowItWorks from '../components/landing/LandingHowItWorks.vue'
import LandingPricing from '../components/landing/LandingPricing.vue'
import LandingFaq from '../components/landing/LandingFaq.vue'
import LandingCta from '../components/landing/LandingCta.vue'
import LandingFooter from '../components/landing/LandingFooter.vue'

useSeoMeta({
  title: 'CitasSaaS — Publica tu página de reservas en 10 minutos',
  description:
    'SaaS multi-tenant de agendamiento para barberías, consultorios médicos, spas y clases. Disponibilidad en tiempo real sin solapamientos y recordatorios por WhatsApp.',
  ogTitle: 'CitasSaaS — Agendamiento de citas inteligente',
  ogDescription:
    'Permite a tus clientes agendar 24/7 sin llamadas. Plantillas listas para tu tipo de negocio.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground font-sans antialiased">
    <!-- Header / Navigation -->
    <LandingNav />

    <main class="flex-1">
      <!-- Hero Section -->
      <LandingHero />

      <!-- Verticals Showcase -->
      <LandingVerticals />

      <!-- Features Grid -->
      <LandingFeatures />

      <!-- How it Works 3 Steps -->
      <LandingHowItWorks />

      <!-- Pricing Plans Comparison -->
      <LandingPricing />

      <!-- Frequently Asked Questions -->
      <LandingFaq />

      <!-- Final CTA Banner -->
      <LandingCta />
    </main>

    <!-- Footer -->
    <LandingFooter />
  </div>
</template>
