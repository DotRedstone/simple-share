<script setup lang="ts">
import ExtractionCode from './ExtractionCode.vue'

defineProps<{
  onExtraction?: (code: string) => void
}>()
</script>

<template>
  <div class="flex flex-col items-center">
    <h1 class="text-lg sm:text-xl font-bold text-white mb-3 text-center tracking-tight">
      安全。极速。 <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">触手可及。</span>
    </h1>

    <div class="w-full z-20">
      <ExtractionCode @submit="onExtraction" />
    </div>

    <p class="mt-3 text-slate-600 text-xs font-mono opacity-60 text-center">
      Protected by End-to-End Encryption
    </p>
  </div>
</template>

