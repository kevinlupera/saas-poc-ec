<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AccordionContent, type AccordionContentProps } from 'radix-vue'
import { cn } from '../../../utils/cn'

const props = defineProps<
  AccordionContentProps & { class?: HTMLAttributes['class'] }
>()
</script>

<template>
  <AccordionContent
    v-bind="props"
    class="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
  >
    <div :class="cn('pb-4 pt-0 text-muted-foreground', props.class)">
      <slot />
    </div>
  </AccordionContent>
</template>
