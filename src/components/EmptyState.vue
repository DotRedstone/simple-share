<script setup lang="ts">
import BaseButton from './BaseButton.vue'

interface Props {
  icon?: string
  title?: string
  description?: string
  actionLabel?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'folder',
  title: '暂无内容',
  description: '这里还没有任何内容',
  actionLabel: ''
})

const emit = defineEmits<{
  (e: 'action'): void
}>()

const iconPaths: Record<string, string> = {
  folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  file: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
}
</script>

<template>
  <div class="flex flex-col items-center justify-center text-slate-500 min-h-[300px] py-12">
    <div class="mb-4">
      <svg
        v-if="iconPaths[icon]"
        class="w-16 h-16 text-slate-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconPaths[icon]" />
      </svg>
    </div>
    <h3 class="text-lg font-medium text-slate-400 mb-2">{{ title }}</h3>
    <p class="text-sm text-slate-500 mb-6 max-w-sm text-center">{{ description }}</p>
    <BaseButton v-if="actionLabel" variant="primary" @click="emit('action')">
      {{ actionLabel }}
    </BaseButton>
  </div>
</template>

