<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useShareStore } from '../stores'
import { useFileStore } from '../stores'
import type { ShareRecord } from '../stores/share'
import BaseButton from './BaseButton.vue'
import BaseModal from './BaseModal.vue'

const shareStore = useShareStore()
const fileStore = useFileStore()

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'manage', share: ShareRecord): void
}>()

const userShares = computed(() => shareStore.getUserShares())

// 当显示时加载分享列表
watch(() => props.show, async (newVal) => {
  if (newVal) {
    await shareStore.fetchUserShares()
  }
})

onMounted(async () => {
  if (props.show) {
    await shareStore.fetchUserShares()
  }
})

const getFileName = (fileId: number): string => {
  const allFiles = fileStore.files
  const findFile = (files: typeof allFiles): string | null => {
    for (const file of files) {
      if (file.id === fileId) return file.name
      if (file.children) {
        const found = findFile(file.children)
        if (found) return found
      }
    }
    return null
  }
  return findFile(allFiles) || `文件 #${fileId}`
}

const shareUrl = (shareCode: string) => {
  return `${window.location.origin}/extract/${shareCode}`
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板！')
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板！')
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const isExpired = (expiresAt: string) => {
  return new Date(expiresAt) < new Date()
}

const handleDelete = async (share: ShareRecord) => {
  if (!confirm(`确定要取消分享 "${getFileName(share.fileId)}" 吗？`)) return
  
  const result = await shareStore.deleteShare(share.id)
  if (!result.success) {
    alert(result.error || '取消分享失败')
  }
}

const handleManage = (share: ShareRecord) => {
  emit('manage', share)
}
</script>

<template>
  <BaseModal :show="show" title="我的分享" width="max-w-4xl" @close="emit('close')">
    <div class="space-y-4">
      <div v-if="userShares.length === 0" class="text-center py-12">
        <svg class="w-16 h-16 text-slate-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        <p class="text-slate-400">还没有分享任何文件</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="share in userShares"
          :key="share.id"
          class="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
          :class="{ 'opacity-50': isExpired(share.expiresAt) }"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <h4 class="text-white dark:text-white light:text-slate-900 font-medium truncate">{{ getFileName(share.fileId) }}</h4>
                <span
                  v-if="isExpired(share.expiresAt)"
                  class="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-300 whitespace-nowrap"
                >
                  已过期
                </span>
                <span
                  v-else
                  class="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-300 whitespace-nowrap"
                >
                  有效
                </span>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="text-slate-400">分享码：</span>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="font-mono text-white dark:text-white light:text-slate-900 font-bold">{{ share.shareCode }}</span>
                    <button
                      @click="copyToClipboard(share.shareCode)"
                      class="p-1 text-slate-400 hover:text-white transition-colors"
                      title="复制分享码"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div>
                  <span class="text-slate-400">分享链接：</span>
                  <div class="flex items-center gap-2 mt-1">
                    <input
                      :value="shareUrl(share.shareCode)"
                      readonly
                      class="flex-1 bg-white/5 dark:bg-white/5 light:bg-slate-100 border border-white/10 dark:border-white/10 light:border-slate-200 rounded px-2 py-1 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 truncate"
                    />
                    <button
                      @click="copyToClipboard(shareUrl(share.shareCode))"
                      class="p-1 text-slate-400 hover:text-white transition-colors"
                      title="复制链接"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div>
                  <span class="text-slate-400">创建时间：</span>
                  <span class="text-white dark:text-white light:text-slate-900">{{ formatDate(share.createdAt) }}</span>
                </div>
                
                <div>
                  <span class="text-slate-400">过期时间：</span>
                  <span class="text-white dark:text-white light:text-slate-900">{{ formatDate(share.expiresAt) }}</span>
                </div>
                
                <div>
                  <span class="text-slate-400">访问次数：</span>
                  <span class="text-white dark:text-white light:text-slate-900">{{ share.accessCount }}</span>
                </div>
              </div>
            </div>
            
            <div class="flex gap-2 ml-4 shrink-0">
              <BaseButton
                variant="glass"
                class="!py-1.5 !px-3 !text-xs"
                @click="handleManage(share)"
                title="管理"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </BaseButton>
              <BaseButton
                variant="glass"
                class="!py-1.5 !px-3 !text-xs !border-red-500/30 !text-red-300 hover:!bg-red-500/10"
                @click="handleDelete(share)"
                title="取消分享"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

