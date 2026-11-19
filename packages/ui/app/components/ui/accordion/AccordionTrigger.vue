<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import {
  AccordionHeader,
  AccordionTrigger,
  type AccordionTriggerProps,
} from 'radix-vue'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '../../../utils/cn'

const props = defineProps<
  AccordionTriggerProps & { class?: HTMLAttributes['class'] }
>()
</script>

<template>
  <AccordionHeader class="flex">
    <AccordionTrigger
      v-bind="props"
      :class="
        cn(
          'flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180',
          props.class,
        )
      "
    >
      <slot />
      <slot name="icon">
        <ChevronDown
          class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
        />
      </slot>
    </AccordionTrigger>
  </AccordionHeader>
</template>
