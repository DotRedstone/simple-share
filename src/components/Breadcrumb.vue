<script setup lang="ts">
import type { FileItem } from '../types'

defineProps<{
  breadcrumbs: FileItem[]
}>()

const emit = defineEmits<{
  (e: 'navigate', index: number): void
  (e: 'navigate-root'): void
}>()
</script>

<template>
  <nav class="flex items-center text-xs md:text-sm text-slate-400 mb-4 md:mb-6 overflow-x-auto -mx-3 md:mx-0 px-3 md:px-0 scrollbar-hide bg-slate-800/30 rounded-lg p-2">
    <button @click="emit('navigate-root')" class="hover:text-white whitespace-nowrap shrink-0 px-2 py-1 rounded hover:bg-white/5">根目录</button>
    <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
      <span class="mx-1 md:mx-2 shrink-0">/</span>
      <button
        @click="emit('navigate', index)"
        class="hover:text-white whitespace-nowrap shrink-0 truncate max-w-[120px] md:max-w-none"
        :class="{ 'text-white font-medium': index === breadcrumbs.length - 1 }"
        :title="crumb.name"
      >
        {{ crumb.name }}
      </button>
    </template>
  </nav>
</template>

