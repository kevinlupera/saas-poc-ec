<script setup lang="ts">
// Type inferred from apps/api/server/api/health.get.ts — no generics.
const { data, error } = await useApi('/api/health')
</script>

<template>
  <main>
    <h1>saas-poc-ec</h1>
    <!-- UiCard comes from the packages/ui layer (auto-imported) -->
    <UiCard title="API status">
      <p v-if="data">API: {{ data.status }} ({{ data.service }})</p>
      <p v-else-if="error">API unreachable</p>
    </UiCard>
  </main>
</template>
