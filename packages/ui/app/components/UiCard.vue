<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <section class="ui-card">
    <h2>{{ title }}</h2>
    <slot />
  </section>
</template>

<style scoped>
.ui-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 20px;
  max-width: 420px;
}
</style>
