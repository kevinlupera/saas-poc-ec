<script setup lang="ts">
import { HEALTH_PATH, type HealthResponse } from '@saas/shared'

const { public: { apiBase } } = useRuntimeConfig()
const { data, error } = await useFetch<HealthResponse>(`${apiBase}${HEALTH_PATH}`)
</script>

<template>
  <main>
    <h1>saas-poc-ec</h1>
    <p v-if="data">API: {{ data.status }} ({{ data.service }})</p>
    <p v-else-if="error">API unreachable</p>
  </main>
</template>
