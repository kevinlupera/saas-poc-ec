<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  id: string
  label: string
  type?: string
  autocomplete?: string
  error?: string
  hint?: string
  disabled?: boolean
}>(), { type: 'text' })
const value = defineModel<string>({ default: '' })
const visible = ref(false)
const password = computed(() => props.type === 'password')
const description = computed(() => [props.hint && `${props.id}-hint`, props.error && `${props.id}-error`].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <div class="space-y-2">
    <Label :for="id">{{ label }}</Label>
    <div class="relative">
      <Input
        :id="id" v-model="value" v-bind="$attrs" :name="id"
        :type="password && visible ? 'text' : type" :autocomplete="autocomplete"
        :disabled="disabled" :aria-invalid="!!error" :aria-describedby="description"
        :class="password ? 'pr-12' : ''"
      />
      <button
        v-if="password" type="button" :disabled="disabled" :aria-controls="id"
        :aria-label="`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`" :aria-pressed="visible"
        class="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="visible = !visible"
      >
        <EyeOff v-if="visible" class="h-4 w-4" aria-hidden="true" />
        <Eye v-else class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
    <p v-if="hint" :id="`${id}-hint`" class="text-xs text-muted-foreground">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="text-sm text-destructive" aria-live="polite">{{ error }}</p>
  </div>
</template>
