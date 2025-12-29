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
  <div class="flex-1 flex flex-col items-center justify-center text-slate-500 py-12 px-4">
    <div class="mb-8 relative">
      <div class="absolute inset-0 bg-brand-primary/10 blur-3xl rounded-full"></div>
      <svg
        v-if="iconPaths[icon]"
        class="w-24 h-24 text-slate-700 dark:text-slate-700 light:text-slate-200 relative z-10 animate-pulse"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="iconPaths[icon]" />
      </svg>
    </div>
    <h3 class="text-2xl font-black text-white dark:text-white light:text-slate-900 mb-3 tracking-tight">{{ title }}</h3>
    <p class="text-base text-slate-500 dark:text-slate-500 light:text-slate-400 mb-8 max-w-sm text-center leading-relaxed font-medium">{{ description }}</p>
    <BaseButton v-if="actionLabel" variant="primary" size="lg" @click="emit('action')" class="shadow-2xl shadow-brand-primary/20">
      {{ actionLabel }}
    </BaseButton>
  </div>
</template>

