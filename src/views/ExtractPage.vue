<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShareStore, useAuthStore } from '../stores'
import PageFrame from '../components/PageFrame.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseModal from '../components/BaseModal.vue'
import { api } from '../api'

const route = useRoute()
const router = useRouter()
const shareStore = useShareStore()
const authStore = useAuthStore()

const shareCode = ref('')
const isLoading = ref(false)
const fileInfo = ref<any>(null)
const fileId = ref<number | null>(null)
const error = ref('')
const showDownloadModal = ref(false)
const showSaveModal = ref(false)
const isAuthenticated = computed(() => authStore.isAuthenticated)

onMounted(() => {
  authStore.initAuth()
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
        downloadUrl: data.data.downloadUrl || data.data.url,
        children: data.data.children
      }
      // 从downloadUrl中提取fileId
      if (data.data.downloadUrl) {
        const url = new URL(data.data.downloadUrl, window.location.origin)
        const id = url.searchParams.get('id')
        if (id) {
          fileId.value = parseInt(id)
        }
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
    showDownloadModal.value = false
  } catch (error) {
    alert('下载失败，请稍后重试')
    showDownloadModal.value = false
  }
}

const handleSave = () => {
  if (!isAuthenticated.value) {
    router.push('/')
    return
  }
  showSaveModal.value = true
}

const confirmSave = async () => {
  if (!fileId.value || !shareCode.value) return
  
  isLoading.value = true
  try {
    const response = await api.post('/files/save', {
      fileId: fileId.value,
      shareCode: shareCode.value
    })
    
    if (response.data?.success) {
      alert('文件已保存到你的文件库')
      router.push('/dashboard')
    } else {
      alert(response.data?.error || '保存失败')
    }
    showSaveModal.value = false
  } catch (error: any) {
    alert(error.response?.data?.error || '保存失败，请稍后重试')
    showSaveModal.value = false
  } finally {
    isLoading.value = false
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
  <div class="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-950 dark:bg-slate-950 light:bg-slate-50 relative overflow-hidden">
    <!-- 装饰背景 -->
    <div class="absolute inset-0 z-0 opacity-20 pointer-events-none">
      <div class="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-primary blur-[120px]"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <PageFrame>
        <div class="text-center mb-8">
          <h1 class="text-3xl font-black text-white dark:text-white light:text-slate-900 mb-2 tracking-tight uppercase italic">文件提取</h1>
          <p class="text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">提取码：<span class="font-mono text-white dark:text-white light:text-brand-primary font-bold">{{ shareCode }}</span></p>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="bg-white/5 dark:bg-white/5 light:bg-white border border-white/10 dark:border-white/10 light:border-slate-200 rounded-3xl p-12 shadow-xl">
          <LoadingSpinner size="lg" text="正在验证提取码..." />
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center shadow-xl">
          <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-red-400 mb-6 font-bold">{{ error }}</p>
          <BaseButton variant="primary" @click="goHome" class="w-full">返回首页</BaseButton>
        </div>

        <!-- 文件信息 -->
        <div v-else-if="fileInfo" class="bg-white/5 dark:bg-white/5 light:bg-white border border-white/10 dark:border-white/10 light:border-slate-200 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div class="text-center mb-8">
            <div class="w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-brand-primary/20 rounded-2xl shadow-inner">
              <svg class="w-12 h-12 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getFileIcon(fileInfo.type)" />
              </svg>
            </div>
            <h2 class="text-xl font-black text-white dark:text-white light:text-slate-900 mb-1 truncate px-2">{{ fileInfo.name }}</h2>
            <p class="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-400 font-mono uppercase tracking-widest">{{ fileInfo.type }} DOCUMENT</p>
          </div>

          <div class="space-y-4 mb-8 bg-black/20 dark:bg-black/20 light:bg-slate-50 rounded-2xl p-4 border border-white/5 dark:border-white/5 light:border-slate-100">
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">文件大小</span>
              <span class="text-white dark:text-white light:text-slate-900 font-mono font-bold">{{ fileInfo.size }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">上传时间</span>
              <span class="text-white dark:text-white light:text-slate-900 font-medium">{{ new Date(fileInfo.uploadTime).toLocaleDateString() }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <BaseButton v-if="fileInfo.type !== 'folder'" variant="primary" class="w-full !py-3 shadow-lg shadow-brand-primary/20" @click="handleDownload">
              立即下载
            </BaseButton>
            <div class="flex gap-3">
              <BaseButton variant="glass" class="flex-1 !py-2.5 !text-xs" @click="goHome">返回首页</BaseButton>
              <BaseButton 
                v-if="isAuthenticated" 
                variant="glass" 
                class="flex-1 !py-2.5 !text-xs" 
                @click="handleSave"
              >
                转存文件
              </BaseButton>
            </div>
          </div>

          <!-- 文件夹内容 -->
          <div v-if="fileInfo.type === 'folder' && fileInfo.children" class="mt-8 border-t border-white/10 pt-6">
            <h3 class="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              文件夹内容 ({{ fileInfo.children.length }} 个项目)
            </h3>
            <div class="space-y-2">
              <div
                v-for="child in fileInfo.children"
                :key="child.id"
                class="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <svg class="w-5 h-5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getFileIcon(child.type)" />
                  </svg>
                  <div class="flex flex-col min-w-0">
                    <span class="text-sm font-medium text-white truncate" :title="child.name">{{ child.name }}</span>
                    <span class="text-[10px] text-slate-500 font-mono">{{ child.size }}</span>
                  </div>
                </div>
                <a
                  v-if="child.type !== 'folder'"
                  :href="child.downloadUrl"
                  download
                  class="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                  title="下载"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </PageFrame>
    </div>

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

    <!-- 转存确认 -->
    <BaseModal :show="showSaveModal" title="转存文件" width="max-w-sm" @close="showSaveModal = false">
      <div class="text-center py-4">
        <p class="text-slate-300 mb-6">确定要将文件 "{{ fileInfo?.name }}" 转存到你的文件库吗？</p>
        <div class="flex gap-3">
          <BaseButton variant="glass" class="flex-1" @click="showSaveModal = false" :disabled="isLoading">取消</BaseButton>
          <BaseButton
            variant="primary"
            class="flex-1"
            @click="confirmSave"
            :loading="isLoading"
            :disabled="isLoading"
          >
            确认转存
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

