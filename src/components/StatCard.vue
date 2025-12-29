<script setup lang="ts">
import type { StatCard as StatCardType } from '../types'

defineProps<{
  stat: StatCardType
}>()
</script>

<template>
  <div class="glass-card p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
    <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
    <h3 class="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{{ stat.title }}</h3>
    <div class="flex items-baseline gap-2">
      <p class="text-4xl font-black tracking-tighter text-white" :class="stat.color">{{ stat.value }}</p>
    </div>
  </div>
</template>

