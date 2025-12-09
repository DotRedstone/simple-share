<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'

interface Props {
  show: boolean
  fileName: string
  shareCode?: string
}

const props = withDefaults(defineProps<Props>(), {
  shareCode: ''
})

const emit = defineEmits(['close', 'generate'])

const expirationDays = ref(7)
const currentShareCode = ref(props.shareCode)

// 监听props变化
watch(() => props.shareCode, (newCode) => {
  if (newCode) {
    currentShareCode.value = newCode
  }
})

const shareUrl = computed(() => {
  if (!currentShareCode.value) return ''
  return `${window.location.origin}/extract/${currentShareCode.value}`
})

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板！')
  } catch (err) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板！')
  }
}

const handleGenerate = () => {
  emit('generate', {
    expirationDays: expirationDays.value
  })
}
</script>

<template>
  <BaseModal :show="show" title="分享文件" width="max-w-md" @close="$emit('close')">
    <div class="space-y-6">
      <div>
        <p class="text-sm text-slate-400 mb-2">文件名：</p>
        <p class="text-white font-medium">{{ fileName }}</p>
      </div>

      <div v-if="currentShareCode">
        <p class="text-sm text-slate-400 mb-2">分享码：</p>
        <div class="flex items-center gap-2">
          <div class="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-lg text-center text-white">
            {{ currentShareCode }}
          </div>
          <BaseButton variant="glass" @click="copyToClipboard(currentShareCode)">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </BaseButton>
        </div>
      </div>

      <div v-if="shareUrl">
        <p class="text-sm text-slate-400 mb-2">分享链接：</p>
        <div class="flex items-center gap-2">
          <input
            :value="shareUrl"
            readonly
            class="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-300"
          />
          <BaseButton variant="glass" @click="copyToClipboard(shareUrl)">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </BaseButton>
        </div>
      </div>

      <div v-if="!currentShareCode">
        <label class="block text-sm text-slate-400 mb-2">有效期（天）：</label>
        <BaseInput
          v-model.number="expirationDays"
          type="number"
          :min="1"
          :max="30"
          placeholder="7"
        />
        <p class="text-xs text-slate-500 mt-1">链接将在 {{ expirationDays }} 天后过期</p>
      </div>

      <div v-if="currentShareCode" class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p class="text-sm text-blue-300">
          <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          分享码已生成，有效期 {{ expirationDays }} 天
        </p>
      </div>

      <div class="flex justify-end gap-3">
        <BaseButton v-if="!currentShareCode" variant="glass" @click="$emit('close')">取消</BaseButton>
        <BaseButton v-if="!currentShareCode" variant="primary" @click="handleGenerate">生成分享码</BaseButton>
        <BaseButton v-if="currentShareCode" variant="primary" @click="$emit('close')">完成</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

