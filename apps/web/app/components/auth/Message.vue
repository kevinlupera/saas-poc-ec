<script setup lang="ts">
defineProps<{ error?: boolean }>()
</script>

<template>
  <p :role="error ? 'alert' : 'status'" :class="error ? 'border-destructive/30 text-destructive' : 'border-border text-foreground'" class="rounded-lg border bg-muted/40 p-3 text-sm leading-relaxed break-words">
    <slot />
  </p>
</template>
