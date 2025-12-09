<script setup lang="ts">
defineProps<{
  modelValue: boolean
  label?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
</script>

<template>
  <label class="inline-flex items-center cursor-pointer group" :class="{ 'opacity-50 cursor-not-allowed': disabled }">
    <div class="relative">
      <input
          type="checkbox"
          class="peer sr-only"
          :checked="modelValue"
          :disabled="disabled"
          @change="(e) => emit('update:modelValue', (e.target as HTMLInputElement).checked)"
      >
      <div class="w-5 h-5 rounded-md border border-white/30 bg-white/5 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all peer-focus:ring-2 peer-focus:ring-blue-500/40"></div>
      <svg class="absolute w-3.5 h-3.5 text-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <span v-if="label" class="ml-3 text-sm text-white/70 group-hover:text-white transition-colors select-none">
      {{ label }}
    </span>
  </label>
</template>