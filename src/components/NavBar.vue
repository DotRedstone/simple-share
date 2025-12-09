<script setup lang="ts">
import BaseButton from './BaseButton.vue'

defineProps<{
  onLoginClick?: () => void
  onRegisterClick?: () => void
}>()
</script>

<template>
  <nav class="flex justify-between items-center shrink-0 pb-2">
    <div class="flex items-center gap-2">
      <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg">S</div>
      <span class="text-base font-bold text-white tracking-tight">SimpleShare</span>
    </div>
    <div v-if="onLoginClick || onRegisterClick" class="flex items-center gap-2">
      <BaseButton 
        v-if="onRegisterClick" 
        variant="glass" 
        class="!px-3 !py-1 !text-xs hidden sm:inline-flex" 
        @click="onRegisterClick"
      >
        注册
      </BaseButton>
      <BaseButton 
        v-if="onLoginClick" 
        variant="primary" 
        class="!px-3 !py-1 !text-xs" 
        @click="onLoginClick"
      >
        登录
      </BaseButton>
    </div>
  </nav>
</template>

