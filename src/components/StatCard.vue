<script setup lang="ts">
import type { StatCard as StatCardType } from '../types'

defineProps<{
  stat: StatCardType
}>()
</script>

<template>
  <div class="bg-white/5 border border-white/10 p-6 rounded-xl">
    <h3 class="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{{ stat.title }}</h3>
    <p class="text-3xl font-mono" :class="stat.color">{{ stat.value }}</p>
  </div>
</template>

