<script setup lang="ts">
import type { HTMLAttributes, InputHTMLAttributes } from 'vue'
import { cn } from '../../../utils/cn'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  type?: InputHTMLAttributes['type']
}>(), {
  type: 'text',
})

const model = defineModel<string>()
</script>

<template>
  <input
    v-model="model"
    :type="type"
    :class="cn(
      'flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base text-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive sm:text-sm',
      props.class,
    )"
  >
</template>
