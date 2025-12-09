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
  <nav class="flex items-center text-sm text-slate-400 mb-6">
    <button @click="emit('navigate-root')" class="hover:text-white">根目录</button>
    <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
      <span class="mx-2">/</span>
      <button
        @click="emit('navigate', index)"
        class="hover:text-white"
        :class="{ 'text-white font-medium': index === breadcrumbs.length - 1 }"
      >
        {{ crumb.name }}
      </button>
    </template>
  </nav>
</template>

