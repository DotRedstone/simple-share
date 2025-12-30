<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseButton from './BaseButton.vue'

const code = ref('')
const isLoading = ref(false)
const error = ref('')

const emit = defineEmits(['submit'])

const isValid = computed(() => {
  return code.value.trim().length >= 4 && code.value.trim().length <= 8
})

const handleSubmit = async () => {
  const trimmedCode = code.value.trim()
  
  if (!trimmedCode) {
    error.value = '请输入提取码'
    return
  }
  
  if (trimmedCode.length < 4 || trimmedCode.length > 8) {
    error.value = '提取码长度应在4-8位之间'
    return
  }
  
  error.value = ''
  isLoading.value = true
  
  try {
    await emit('submit', trimmedCode)
  } finally {
    isLoading.value = false
  }
}

const handleInput = () => {
  error.value = ''
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="w-full group">
    <div class="relative flex items-center p-1 bg-surface-900/50 dark:bg-surface-900/50 light:bg-white border border-white/10 dark:border-white/10 light:border-slate-200 rounded-2xl focus-within:border-brand-primary/50 focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all duration-300 shadow-xl dark:shadow-none">
      <div class="pl-4 text-slate-500">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 15V17M12 7V13M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <input
        v-model="code"
        type="text"
        placeholder="输入提取码"
        maxlength="8"
        @input="handleInput"
        class="flex-1 bg-transparent border-none py-3 sm:py-4 px-2 sm:px-3 text-base sm:text-lg font-bold tracking-widest text-white dark:text-white light:text-slate-900 placeholder:text-slate-600 dark:placeholder:text-slate-600 light:placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal outline-none min-w-0"
      />
      <BaseButton
        type="submit"
        variant="primary"
        :loading="isLoading"
        :disabled="!isValid || isLoading"
        class="!rounded-xl shadow-lg !px-3 sm:!px-8 !py-2 sm:!py-2.5 flex-shrink-0"
      >
        <span class="text-xs sm:text-base">立即提取</span>
      </BaseButton>
    </div>
    <div class="h-6 mt-2 overflow-hidden text-center">
      <Transition 
        enter-active-class="transition duration-300"
        enter-from-class="translate-y-4 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-4 opacity-0"
      >
        <p v-if="error" class="text-sm font-medium text-red-400">{{ error }}</p>
        <p v-else-if="code && !isValid" class="text-xs font-mono text-slate-500 uppercase tracking-tighter">
          Code length: <span class="text-brand-primary">{{ code.length }}</span> / 4-8
        </p>
      </Transition>
    </div>
  </form>
</template>
