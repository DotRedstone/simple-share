<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from './BaseModal.vue'
import BaseInput from './BaseInput.vue'
import BaseButton from './BaseButton.vue'

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()

const extractCode = ref('')
const isLoading = ref(false)
const error = ref('')

const handleExtract = async () => {
  if (!extractCode.value.trim()) {
    error.value = '请输入提取码'
    return
  }

  isLoading.value = true
  error.value = ''
  
  try {
    const code = extractCode.value.trim().toUpperCase()
    // 验证提取码是否存在
    const response = await fetch(`/api/extract/${code}`)
    const data = await response.json()
    
    if (response.ok && data.success) {
      emit('close')
      router.push(`/extract/${code}`)
    } else {
      error.value = data.error || '提取码无效或已过期'
    }
  } catch (err) {
    error.value = '验证失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <BaseModal :show="show" title="提取文件" width="max-w-sm" @close="emit('close')">
    <div class="space-y-6 py-2">
      <div class="text-center">
        <div class="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        </div>
        <p class="text-slate-400 text-sm">输入 6 位提取码以获取分享的文件</p>
      </div>

      <div class="space-y-4">
        <BaseInput
          v-model="extractCode"
          placeholder="例如：AB12CD"
          class="text-center text-lg font-mono tracking-widest uppercase"
          @keyup.enter="handleExtract"
          autofocus
        />
        
        <div v-if="error" class="text-red-400 text-xs text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">
          {{ error }}
        </div>

        <BaseButton
          variant="primary"
          class="w-full py-3 shadow-lg shadow-brand-primary/20"
          :loading="isLoading"
          :disabled="isLoading || !extractCode.trim()"
          @click="handleExtract"
        >
          立即提取
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

