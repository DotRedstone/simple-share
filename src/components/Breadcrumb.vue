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
  <nav class="flex items-center text-xs md:text-sm text-slate-400 overflow-x-auto scrollbar-hide bg-surface-800/40 backdrop-blur-sm rounded-xl p-1.5 md:p-2 border border-white/5 shadow-inner">
    <button 
      @click="emit('navigate-root')" 
      class="flex items-center gap-2 hover:text-white whitespace-nowrap shrink-0 px-3 md:px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white/5 font-bold group"
    >
      <svg class="w-4 h-4 text-slate-500 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      <span>根目录</span>
    </button>
    <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
      <div class="flex items-center shrink-0">
        <svg class="w-4 h-4 mx-1 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <button
          @click="emit('navigate', index)"
          class="hover:text-white whitespace-nowrap shrink-0 truncate max-w-[120px] md:max-w-[200px] px-3 md:px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white/5 font-medium"
          :class="{ 'text-white font-black bg-white/5': index === breadcrumbs.length - 1 }"
          :title="crumb.name"
        >
          {{ crumb.name }}
        </button>
      </div>
    </template>
  </nav>
</template>

