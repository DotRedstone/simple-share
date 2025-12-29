<script setup lang="ts">
import type { StatCard as StatCardType } from '../types'

defineProps<{
  stat: StatCardType
}>()
</script>

<template>
  <div class="glass-card p-6 md:p-8 rounded-[2rem] border border-white/5 dark:border-white/5 light:border-slate-200 relative overflow-hidden group min-w-0">
    <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/5 dark:bg-white/5 light:bg-slate-100 rounded-full blur-2xl group-hover:bg-white/10 dark:group-hover:bg-white/10 light:group-hover:bg-slate-200 transition-colors"></div>
    <h3 class="text-slate-500 dark:text-slate-500 light:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 truncate">{{ stat.title }}</h3>
    <div class="flex items-baseline gap-2">
      <p class="text-3xl md:text-4xl font-black tracking-tighter text-white dark:text-white light:text-slate-900 truncate" :class="stat.color" :title="String(stat.value)">{{ stat.value }}</p>
    </div>
  </div>
</template>

