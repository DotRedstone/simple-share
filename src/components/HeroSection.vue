<script setup lang="ts">
import ExtractionCode from './ExtractionCode.vue'

defineProps<{
  onExtraction?: (code: string) => void
}>()
</script>

<template>
  <div class="flex flex-col items-center py-8">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-bold uppercase tracking-widest mb-6 animate-fade-in">
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
      </span>
      New: Version 2.0 is live
    </div>
    
    <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-6 text-center tracking-tight leading-tight">
      安全。极速。<br />
      <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-blue-400">
        文件传输，触手可及。
      </span>
    </h1>

    <p class="text-slate-400 text-center max-w-md mb-10 text-lg leading-relaxed">
      SimpleShare 提供端到端加密的文件分享体验，无需注册即可快速提取。
    </p>

    <div class="w-full max-w-md z-20">
      <ExtractionCode @submit="onExtraction" />
    </div>

    <div class="mt-12 flex items-center gap-8 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-500">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/><path d="M12 6c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z"/></svg>
        <span class="text-xs font-bold text-white uppercase tracking-tighter">Secure Protocol</span>
      </div>
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7zm0 1.414L18.586 9H13V3.414zM18 20H6V4h5v7h7v9z"/></svg>
        <span class="text-xs font-bold text-white uppercase tracking-tighter">P2P Sharing</span>
      </div>
    </div>
  </div>
</template>

