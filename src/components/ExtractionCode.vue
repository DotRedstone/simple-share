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
  <form @submit.prevent="handleSubmit" class="w-full">
    <div class="flex gap-2">
      <input
        v-model="code"
        type="text"
        placeholder="输入提取码（4-8位）..."
        maxlength="8"
        @input="handleInput"
        class="flex-1 pl-4 pr-4 py-3 text-base text-white bg-white/5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300"
        :class="error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : isValid ? 'border-green-500/50' : 'border-white/10'"
      />
      <BaseButton
        type="submit"
        variant="primary"
        :loading="isLoading"
        :disabled="!isValid || isLoading"
        class="!py-3 !px-4 shrink-0"
      >
        提取
      </BaseButton>
    </div>
    <p v-if="error" class="mt-2 text-sm text-red-400 text-center">{{ error }}</p>
    <p v-else-if="code && !isValid" class="mt-2 text-sm text-slate-500 text-center">
      提取码长度：{{ code.length }}/4-8
    </p>
  </form>
</template>
