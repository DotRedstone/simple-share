<script setup lang="ts">
import { ref, computed } from 'vue'
import type { User } from '../types'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import BaseModal from './BaseModal.vue'

const props = defineProps<{
  user: User
}>()

const emit = defineEmits<{
  (e: 'update-quota', userId: string, quota: number): void
}>()

const showModal = ref(false)
const newQuota = ref(props.user.storageQuota || 0)

const openModal = () => {
  newQuota.value = props.user.storageQuota || 0
  showModal.value = true
}

const handleSave = () => {
  emit('update-quota', props.user.id, newQuota.value)
  showModal.value = false
}

const formatSize = (gb: number) => {
  if (gb >= 1024) {
    return (gb / 1024).toFixed(2) + ' TB'
  }
  return gb.toFixed(2) + ' GB'
}

const usagePercentage = computed(() => {
  if (!props.user.storageQuota || props.user.storageQuota === 0) return 0
  const used = props.user.storageUsed || 0
  return (used / props.user.storageQuota * 100).toFixed(1)
})
</script>

<template>
  <div>
    <button
      @click="openModal"
      class="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
      <span>{{ formatSize(user.storageUsed || 0) }} / {{ formatSize(user.storageQuota || 0) }}</span>
    </button>

    <BaseModal :show="showModal" title="分配存储空间" width="max-w-sm" @close="showModal = false">
      <div class="space-y-4">
        <div>
          <p class="text-sm text-slate-400 mb-2">用户：{{ user.name }}</p>
          <div class="bg-white/5 border border-white/10 rounded-lg p-3 mb-3">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs text-slate-400">已用存储</span>
              <span class="text-sm text-white font-mono">{{ formatSize(user.storageUsed || 0) }}</span>
            </div>
            <div class="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                :style="{ width: usagePercentage + '%' }"
              ></div>
            </div>
          </div>
        </div>
        <BaseInput
          v-model.number="newQuota"
          type="number"
          label="存储配额 (GB)"
          :min="user.storageUsed || 0"
        />
        <div class="flex justify-end gap-3">
          <BaseButton variant="glass" @click="showModal = false">取消</BaseButton>
          <BaseButton variant="primary" @click="handleSave">保存</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

