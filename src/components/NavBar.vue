<script setup lang="ts">
import BaseButton from './BaseButton.vue'

defineProps<{
  onLoginClick?: () => void
  onRegisterClick?: () => void
}>()
</script>

<template>
  <nav class="flex justify-between items-center py-4 px-1">
    <div class="flex items-center gap-3 group cursor-pointer">
      <div class="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center glass-card group-hover:scale-110 transition-transform duration-300">
        <img src="/favicon-96x96.png" alt="SimpleShare" class="w-7 h-7 object-contain" />
      </div>
      <div class="flex flex-col">
        <span class="text-lg font-bold text-white tracking-tighter leading-none">SimpleShare</span>
        <span class="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Cloud Transfer</span>
      </div>
    </div>
    <div v-if="onLoginClick || onRegisterClick" class="flex items-center gap-3">
      <button 
        v-if="onRegisterClick" 
        class="text-sm font-semibold text-slate-400 hover:text-white transition-colors px-4 py-2"
        @click="onRegisterClick"
      >
        注册
      </button>
      <BaseButton 
        v-if="onLoginClick" 
        variant="primary" 
        @click="onLoginClick"
      >
        登录
      </BaseButton>
    </div>
  </nav>
</template>

