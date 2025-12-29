<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { FileItem } from '../types'
import { useFileStore } from '../stores/file'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  show: boolean
  selectedFiles: number[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const fileStore = useFileStore()
const isLoading = ref(false)
const modalBreadcrumbs = ref<FileItem[]>([])
const modalFiles = ref<FileItem[]>([])

// 计算当前显示的文件夹列表
const currentFolders = computed(() => {
  return modalFiles.value.filter(f => f.type === 'folder')
})

// 加载指定目录下的文件夹
const loadFolders = async (parentId: number | null = null) => {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    if (parentId !== null) {
      params.append('parentId', parentId.toString())
    }
    
    const response = await fetch(`/api/files/list?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    })
    const data = await response.json()
    if (data.success) {
      modalFiles.value = data.data
    }
  } catch (error) {
    console.error('加载文件夹失败:', error)
  } finally {
    isLoading.value = false
  }
}

const navigateToFolder = (folder: FileItem) => {
  modalBreadcrumbs.value.push(folder)
  loadFolders(folder.id)
}

const navigateToBreadcrumb = (index: number) => {
  modalBreadcrumbs.value = modalBreadcrumbs.value.slice(0, index + 1)
  const lastCrumb = modalBreadcrumbs.value[modalBreadcrumbs.value.length - 1]
  loadFolders(lastCrumb ? lastCrumb.id : null)
}

const navigateToRoot = () => {
  modalBreadcrumbs.value = []
  loadFolders(null)
}

const handleConfirmMove = async () => {
  const lastBreadcrumb = modalBreadcrumbs.value[modalBreadcrumbs.value.length - 1]
  const targetFolderId = lastBreadcrumb ? lastBreadcrumb.id : null
  
  isLoading.value = true
  try {
    const result = await fileStore.moveFiles(props.selectedFiles, targetFolderId)
    if (result.success) {
      emit('success')
    } else {
      alert(result.error || '移动文件失败')
    }
  } catch (error) {
    alert('移动文件失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadFolders(null)
})
</script>

<template>
  <BaseModal
    :show="show"
    title="选择目标文件夹"
    width="max-w-2xl"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <p class="text-sm text-slate-300">
        已选择 <span class="font-semibold text-white">{{ selectedFiles.length }}</span> 个文件
      </p>
      
      <!-- 面包屑导航 -->
      <div class="flex items-center gap-2 text-xs text-slate-400 overflow-x-auto py-1 no-scrollbar">
        <button
          @click="navigateToRoot"
          class="hover:text-white px-2 py-1 rounded hover:bg-white/5 shrink-0"
        >
          根目录
        </button>
        <template v-for="(crumb, index) in modalBreadcrumbs" :key="crumb.id">
          <span class="shrink-0">/</span>
          <button
            @click="navigateToBreadcrumb(index)"
            class="hover:text-white px-2 py-1 rounded hover:bg-white/5 truncate max-w-[150px] shrink-0"
            :title="crumb.name"
          >
            {{ crumb.name }}
          </button>
        </template>
      </div>

      <!-- 文件夹列表 -->
      <div class="bg-white/5 border border-white/10 rounded-lg p-4 min-h-[200px] max-h-96 overflow-y-auto relative">
        <div v-if="isLoading" class="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
          <LoadingSpinner size="md" />
        </div>

        <div v-if="currentFolders.length === 0 && !isLoading" class="text-center text-slate-400 py-12">
          <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p>当前目录下没有文件夹</p>
          <p class="text-xs mt-2">您可以将文件移动到此目录</p>
        </div>

        <div
          v-for="folder in currentFolders"
          :key="folder.id"
          @click="navigateToFolder(folder)"
          class="w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors cursor-pointer flex items-center gap-3 hover:bg-white/10 border border-transparent hover:border-white/10 group"
        >
          <svg class="w-5 h-5 text-yellow-400 shrink-0 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.165 19.551c.086.58.586 1.01 1.173 1.01h17.324c.587 0 1.087-.43 1.173-1.01l1.161-7.854c.099-.672-.42-1.282-1.096-1.282H2.099c-.676 0-1.195.61-1.096 1.282l1.162 7.854z" opacity=".4"></path>
            <path d="M3.338 10.415h17.324c.969 0 1.713.874 1.571 1.833L21.071 20.1c-.086.58-.586 1.01-1.173 1.01H4.101c-.587 0-1.087-.43-1.173-1.01L1.767 12.248c-.142-.959.602-1.833 1.571-1.833z"></path>
          </svg>
          <span class="text-white font-medium flex-1 truncate">{{ folder.name }}</span>
          <svg class="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <!-- 当前目录提示 -->
      <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-blue-200">
              <span class="font-semibold">目标目录：</span>
              <span v-if="modalBreadcrumbs.length === 0" class="text-blue-400">根目录</span>
              <span v-else class="text-blue-400">{{ modalBreadcrumbs[modalBreadcrumbs.length - 1]?.name }}</span>
            </p>
            <p class="text-blue-400/70 text-xs mt-1">选中的文件将被移动到上述位置</p>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <BaseButton variant="glass" @click="emit('close')" :disabled="isLoading">
          取消
        </BaseButton>
        <BaseButton 
          variant="primary" 
          @click="handleConfirmMove" 
          :loading="isLoading" 
          :disabled="isLoading || props.selectedFiles.length === 0"
        >
          确认移动到此处
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

