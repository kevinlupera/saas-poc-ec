<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../utils/cn'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <label :class="cn('text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70', props.class)">
    <slot />
  </label>
</template>
