<script setup lang="ts">
// Type inferred from apps/api/server/api/health.get.ts — no generics.
const { data, error } = await useApi('/api/health')
</script>

<template>
  <main class="min-h-screen bg-background text-foreground p-8 flex flex-col gap-6">
    <h1 class="text-3xl font-bold tracking-tight">saas-poc-ec</h1>

    <!-- UiCard comes from the packages/ui layer (auto-imported) -->
    <UiCard title="API status">
      <p v-if="data" class="text-sm text-muted-foreground">API: {{ data.status }} ({{ data.service }})</p>
      <p v-else-if="error" class="text-sm text-destructive">API unreachable</p>
    </UiCard>

    <section class="flex flex-wrap gap-4 items-center">
      <!-- Shadcn Button via auto-import from @saas/ui layer -->
      <Button variant="default">Primary Token</Button>
      <Button variant="secondary">Secondary Token</Button>
      <Button variant="outline">Outline Token</Button>
      <Button variant="destructive">Destructive Token</Button>
    </section>
  </main>
</template>
