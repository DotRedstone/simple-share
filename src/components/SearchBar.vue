<script setup lang="ts">
import BaseInput from './BaseInput.vue'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div class="flex-1 min-w-0 max-w-sm md:max-w-md">
    <BaseInput :model-value="modelValue" placeholder="搜索当前目录..." @update:model-value="emit('update:modelValue', $event)">
      <template #icon>
        <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </template>
    </BaseInput>
  </div>
</template>

