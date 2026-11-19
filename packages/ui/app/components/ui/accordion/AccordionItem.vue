<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import {
  AccordionItem,
  type AccordionItemProps,
  useForwardProps,
} from 'radix-vue'
import { cn } from '../../../utils/cn'

const props = defineProps<
  AccordionItemProps & { class?: HTMLAttributes['class'] }
>()

const forwardedProps = useForwardProps(props)
</script>

<template>
  <AccordionItem
    v-bind="forwardedProps"
    :class="cn('border-b', props.class)"
  >
    <slot />
  </AccordionItem>
</template>
