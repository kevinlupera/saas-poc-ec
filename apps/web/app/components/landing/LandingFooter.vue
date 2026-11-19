<script setup lang="ts">
import { Calendar } from 'lucide-vue-next'
</script>

<template>
  <footer class="border-t border-border bg-card text-card-foreground">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand Info -->
        <div class="space-y-4 md:col-span-1">
          <div class="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
              <Calendar class="h-4 w-4" />
            </div>
            <span class="font-extrabold text-foreground">Citas<span class="text-primary/70">SaaS</span></span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Plataforma SaaS multi-tenant de agendamiento y reservas en tiempo real para negocios de servicios en Ecuador y LatAm.
          </p>
        </div>

        <!-- Links Column 1: Producto -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-foreground">Producto</h4>
          <ul class="space-y-2 text-xs text-muted-foreground">
            <li><a href="#verticales" class="hover:text-foreground transition-colors">Plantillas por vertical</a></li>
            <li><a href="#funcionalidades" class="hover:text-foreground transition-colors">Disponibilidad en tiempo real</a></li>
            <li><a href="#funcionalidades" class="hover:text-foreground transition-colors">WhatsApp & Notificaciones</a></li>
            <li><a href="#precios" class="hover:text-foreground transition-colors">Planes y Precios</a></li>
          </ul>
        </div>

        <!-- Links Column 2: Legal -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-foreground">Legal & Privacidad</h4>
          <ul class="space-y-2 text-xs text-muted-foreground">
            <li><a href="/terms" class="hover:text-foreground transition-colors">Términos del servicio</a></li>
            <li><a href="/privacy" class="hover:text-foreground transition-colors">Política de privacidad (LOPDP)</a></li>
            <li><a href="#cookies" class="hover:text-foreground transition-colors">Consentimiento de cookies</a></li>
            <li><a href="#seguridad" class="hover:text-foreground transition-colors">Aislamiento de datos (RLS)</a></li>
          </ul>
        </div>

        <!-- Links Column 3: Soporte -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-foreground">Soporte y Contacto</h4>
          <ul class="space-y-2 text-xs text-muted-foreground">
            <li><a href="/support" class="hover:text-foreground transition-colors">Centro de ayuda</a></li>
            <li><a href="#soporte-whatsapp" class="hover:text-foreground transition-colors">Atención vía WhatsApp</a></li>
            <li><a href="mailto:soporte@citas.ec" class="hover:text-foreground transition-colors">soporte@citas.ec</a></li>
            <li><span class="text-muted-foreground/80">Zona horaria: America/Guayaquil</span></li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>© 2026 CitasSaaS Ecuador. Todos los derechos reservados.</p>
        <p class="text-[11px]">Diseñado con Nuxt 3, Tailwind CSS y shadcn-vue tokens.</p>
      </div>
    </div>
  </footer>
</template>
