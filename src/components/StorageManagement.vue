<script setup lang="ts">
import { ref, computed } from 'vue'
import type { StorageStats } from '../types'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import BaseModal from './BaseModal.vue'

const props = defineProps<{
  stats: StorageStats
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const showR2Settings = ref(false)
const r2BucketName = ref('simpleshare-files')
const r2Region = ref('auto')
const isSaving = ref(false)

const storagePercentage = computed(() => {
  return props.stats.totalStorage > 0 
    ? (props.stats.usedStorage / props.stats.totalStorage * 100).toFixed(1)
    : '0'
})

const formatSize = (gb: number) => {
  if (gb >= 1024) {
    return (gb / 1024).toFixed(2) + ' TB'
  }
  return gb.toFixed(2) + ' GB'
}

const handleSaveR2Settings = async () => {
  isSaving.value = true
  try {
    alert('R2 存储配置需要在 Cloudflare Dashboard 中设置。\n\n存储桶名称: ' + r2BucketName.value + '\n区域: ' + r2Region.value)
    showR2Settings.value = false
    emit('refresh')
  } catch (error) {
    alert('保存配置失败')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 存储概览 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white/5 border border-white/10 rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-400 uppercase">总存储</span>
          <svg class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        </div>
        <p class="text-2xl font-mono text-white">{{ formatSize(stats.totalStorage) }}</p>
      </div>

      <div class="bg-white/5 border border-white/10 rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-400 uppercase">已用存储</span>
          <svg class="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p class="text-2xl font-mono text-purple-400">{{ formatSize(stats.usedStorage) }}</p>
      </div>

      <div class="bg-white/5 border border-white/10 rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-400 uppercase">可用存储</span>
          <svg class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-2xl font-mono text-green-400">{{ formatSize(stats.availableStorage) }}</p>
      </div>
    </div>

    <!-- 存储使用进度 -->
    <div class="bg-white/5 border border-white/10 rounded-xl p-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-bold text-white">存储使用情况</h3>
        <span class="text-sm text-slate-400">{{ storagePercentage }}%</span>
      </div>
      <div class="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
          :style="{ width: storagePercentage + '%' }"
        ></div>
      </div>
      <div class="flex justify-between items-center mt-2 text-xs text-slate-500">
        <span>{{ formatSize(stats.usedStorage) }} 已使用</span>
        <span>{{ formatSize(stats.availableStorage) }} 可用</span>
      </div>
    </div>

    <!-- R2 存储桶信息 -->
    <div class="bg-white/5 border border-white/10 rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-white">Cloudflare R2 存储</h3>
        <BaseButton variant="glass" class="!py-1.5 !px-3 !text-xs" @click="showR2Settings = true">
          <svg class="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          配置
        </BaseButton>
      </div>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-slate-400">存储桶数量</span>
          <p class="text-white font-bold mt-1">{{ stats.r2Buckets }}</p>
        </div>
        <div>
          <span class="text-slate-400">总文件数</span>
          <p class="text-white font-bold mt-1">{{ stats.totalFiles.toLocaleString() }}</p>
        </div>
      </div>
    </div>

    <!-- R2 设置模态框 -->
    <BaseModal :show="showR2Settings" title="R2 存储配置" width="max-w-md" @close="showR2Settings = false">
      <div class="space-y-4">
        <BaseInput
          v-model="r2BucketName"
          label="存储桶名称"
          placeholder="simpleshare-files"
        />
        <BaseInput
          v-model="r2Region"
          label="区域"
          placeholder="auto"
        />
        <div class="flex justify-end gap-3">
          <BaseButton variant="glass" @click="showR2Settings = false" :disabled="isSaving">取消</BaseButton>
          <BaseButton variant="primary" @click="handleSaveR2Settings" :loading="isSaving" :disabled="isSaving">保存</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

