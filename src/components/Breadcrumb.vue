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
  <nav class="flex items-center text-xs md:text-sm text-slate-400 overflow-x-auto scrollbar-hide bg-slate-800/30 rounded-lg p-2 md:p-3 border border-white/5">
    <button 
      @click="emit('navigate-root')" 
      class="hover:text-white whitespace-nowrap shrink-0 px-2 md:px-3 py-1.5 rounded transition-colors hover:bg-white/5 font-medium"
    >
      根目录
    </button>
    <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
      <span class="mx-1 md:mx-2 shrink-0 text-slate-500">/</span>
      <button
        @click="emit('navigate', index)"
        class="hover:text-white whitespace-nowrap shrink-0 truncate max-w-[120px] md:max-w-[200px] px-2 md:px-3 py-1.5 rounded transition-colors hover:bg-white/5"
        :class="{ 'text-white font-semibold': index === breadcrumbs.length - 1 }"
        :title="crumb.name"
      >
        {{ crumb.name }}
      </button>
    </template>
  </nav>
</template>

