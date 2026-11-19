<script setup lang="ts">
import { HelpCircle } from 'lucide-vue-next'
import { FAQS } from '../../data/landing'
</script>

<template>
  <section id="faq" class="py-20 bg-muted/20 border-t border-border/50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center space-y-4 mb-12">
        <Badge variant="outline" class="gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-semibold">
          <HelpCircle class="h-3.5 w-3.5 text-primary" />
          Dudas Frecuentes
        </Badge>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Preguntas frecuentes
        </h2>
        <p class="text-muted-foreground text-base sm:text-lg">
          Todo lo que necesitas saber sobre el funcionamiento, límites y planes.
        </p>
      </div>

      <!-- Accordion -->
      <div class="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm">
        <Accordion type="single" collapsible class="w-full">
          <AccordionItem
            v-for="faq in FAQS"
            :key="faq.id"
            :value="faq.id"
          >
            <AccordionTrigger class="text-base font-semibold text-foreground py-4 hover:no-underline">
              {{ faq.question }}
            </AccordionTrigger>
            <AccordionContent class="text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
              {{ faq.answer }}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  </section>
</template>
