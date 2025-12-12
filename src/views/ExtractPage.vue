<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShareStore } from '../stores'
import PageFrame from '../components/PageFrame.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseModal from '../components/BaseModal.vue'

const route = useRoute()
const router = useRouter()
const shareStore = useShareStore()

const shareCode = ref('')
const isLoading = ref(false)
const fileInfo = ref<any>(null)
const error = ref('')
const showDownloadModal = ref(false)

onMounted(() => {
  const code = route.params.code as string
  if (code) {
    shareCode.value = code.toUpperCase()
    fetchFileInfo(code.toUpperCase())
  }
})

const fetchFileInfo = async (code: string) => {
  isLoading.value = true
  error.value = ''
  
  try {
    // 从 API 获取文件信息
    const response = await fetch(`/api/extract/${code}`)
    const data = await response.json()
    
    if (response.ok && data.success && data.data) {
      fileInfo.value = {
        name: data.data.name,
        size: data.data.size,
        uploadTime: data.data.uploadTime || data.data.created_at,
        type: data.data.type,
        downloadUrl: data.data.downloadUrl || data.data.url
      }
      // 增加访问计数
      const share = await shareStore.getShareByCode(code)
      if (share) {
        shareStore.incrementAccess(code)
      }
    } else {
      error.value = data.error || '提取码无效或已过期'
    }
  } catch (err) {
    error.value = '获取文件信息失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

const handleDownload = () => {
  if (fileInfo.value) {
    showDownloadModal.value = true
  }
}

const confirmDownload = async () => {
  if (!fileInfo.value) return
  
  try {
    // 从 downloadUrl 中提取文件ID
    const url = new URL(fileInfo.value.downloadUrl, window.location.origin)
    const fileId = parseInt(url.searchParams.get('id') || '0')
    
    if (fileId) {
      // 使用 fetch 下载文件
      const response = await fetch(fileInfo.value.downloadUrl)
      if (!response.ok) {
        throw new Error('下载失败')
      }
      
      const blob = await response.blob()
      const urlObj = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = urlObj
      a.download = fileInfo.value.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(urlObj)
    }
    showDownloadModal.value = false
  } catch (error) {
    alert('下载失败，请稍后重试')
    showDownloadModal.value = false
  }
}

const getFileIcon = (type: string) => {
  const icons: Record<string, string> = {
    pdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    zip: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
  }
  return icons[type] || 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
}

const goHome = () => {
  // 使用 replace 避免路由历史问题，如果还是有问题就用 window.location
  router.replace('/').catch(() => {
    window.location.href = '/'
  })
}
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center p-4 sm:p-6">
    <div class="w-full max-w-md">
      <PageFrame>
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">文件提取</h1>
          <p class="text-slate-400">提取码：<span class="font-mono text-white">{{ shareCode }}</span></p>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="bg-white/5 border border-white/10 rounded-2xl p-12">
          <LoadingSpinner size="lg" text="正在验证提取码..." />
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
          <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-red-400 mb-6">{{ error }}</p>
          <BaseButton variant="primary" @click="goHome">返回首页</BaseButton>
        </div>

        <!-- 文件信息 -->
        <div v-else-if="fileInfo" class="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div class="text-center mb-6">
            <div class="w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-blue-500/20 rounded-2xl">
              <svg class="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getFileIcon(fileInfo.type)" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">{{ fileInfo.name }}</h2>
          </div>

          <div class="space-y-3 mb-6">
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-400">文件大小</span>
              <span class="text-white font-mono">{{ fileInfo.size }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-400">上传时间</span>
              <span class="text-white">{{ fileInfo.uploadTime }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-400">文件类型</span>
              <span class="text-white uppercase">{{ fileInfo.type }}</span>
            </div>
          </div>

          <div class="flex gap-3">
            <BaseButton variant="glass" class="flex-1" @click="goHome">返回首页</BaseButton>
            <BaseButton variant="primary" class="flex-1" @click="handleDownload">下载文件</BaseButton>
          </div>
        </div>
      </PageFrame>
    <!-- 下载确认 -->
    <BaseModal :show="showDownloadModal" title="下载文件" width="max-w-sm" @close="showDownloadModal = false">
      <div class="text-center py-4">
        <p class="text-slate-300 mb-6">准备下载文件：{{ fileInfo?.name }}</p>
        <div class="flex gap-3">
          <BaseButton variant="glass" class="flex-1" @click="showDownloadModal = false">取消</BaseButton>
          <BaseButton
            variant="primary"
            class="flex-1"
            @click="confirmDownload"
          >
            确认下载
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

