<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useFileStore, useShareStore } from '../stores'
import type { FileItem, MenuItem, FileAction } from '../types'
import type { ShareRecord } from '../stores/share'
import PageFrame from '../components/PageFrame.vue'
import Sidebar from '../components/Sidebar.vue'
import SearchBar from '../components/SearchBar.vue'
import ViewModeToggle from '../components/ViewModeToggle.vue'
import Breadcrumb from '../components/Breadcrumb.vue'
import FileListView from '../components/FileListView.vue'
import BaseButton from '../components/BaseButton.vue'
import UploadModal from '../components/UploadModal.vue'
import ShareModal from '../components/ShareModal.vue'
import ShareList from '../components/ShareList.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const router = useRouter()
const authStore = useAuthStore()
const fileStore = useFileStore()
const shareStore = useShareStore()

const showUpload = ref(false)
const showShare = ref(false)
const showShareList = ref(false)
const currentShareFile = ref<FileItem | null>(null)
const shareCode = ref('')
const activeOptionsMenu = ref<number | null>(null)
const isLoading = ref(false)

const username = computed(() => authStore.user?.name || '用户')
const viewMode = computed({
  get: () => fileStore.viewMode,
  set: (val) => { fileStore.viewMode = val }
})
const activeTab = computed({
  get: () => fileStore.activeTab,
  set: (val) => { fileStore.setActiveTab(val) }
})
const searchQuery = computed({
  get: () => fileStore.searchQuery,
  set: (val) => { fileStore.searchQuery = val }
})
const breadcrumbs = computed(() => fileStore.breadcrumbs)
const currentFiles = computed(() => {
  if (activeTab.value === 'shares') {
    const shares = shareStore.getUserShares()
    const allFiles = fileStore.files
    const findFile = (files: typeof allFiles, fileId: number): FileItem | null => {
      for (const file of files) {
        if (file.id === fileId) return file
        if (file.children) {
          const found = findFile(file.children, fileId)
          if (found) return found
        }
      }
      return null
    }
    return shares.map(share => findFile(allFiles, share.fileId)).filter(f => f !== null) as FileItem[]
  }
  return fileStore.currentFiles
})

const menuItems: MenuItem[] = [
  { id: 'all', label: '全部文件', icon: 'folder' },
  { id: 'recent', label: '最近上传', icon: 'clock' },
  { id: 'starred', label: '我的收藏', icon: 'star' },
  { id: 'shares', label: '我的分享', icon: 'share' },
]

const initFiles = async () => {
  isLoading.value = true
  try {
    const parentId = breadcrumbs.value.length > 0 
      ? breadcrumbs.value[breadcrumbs.value.length - 1]?.id 
      : null
    
    const result = await fileStore.fetchFiles(parentId)
    if (!result.success) {
      fileStore.setFiles([])
    }
  } catch (error) {
    fileStore.setFiles([])
  } finally {
    isLoading.value = false
  }
}

const navigateToBreadcrumb = (index: number) => {
  fileStore.navigateToBreadcrumb(index)
}


onMounted(() => {
  authStore.initAuth()
  initFiles()
  document.addEventListener('click', closeOptionsMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeOptionsMenu)
})

watch(() => activeTab.value, () => {
  activeOptionsMenu.value = null
  initFiles() // 切换标签页时重新加载文件
})

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}

const toggleOptionsMenu = (fileId: number) => {
  activeOptionsMenu.value = activeOptionsMenu.value === fileId ? null : fileId
}

const closeOptionsMenu = (event?: MouseEvent) => {
  if (event) {
    const target = event.target as HTMLElement
    if (target.closest('.options-menu-container')) return
  }
  activeOptionsMenu.value = null
}

const handleFileClick = (file: FileItem) => {
  // 只有在全部文件标签页且是文件夹时才能进入
  if (activeTab.value === 'all' && file.type === 'folder') {
    fileStore.navigateToFolder(file)
  }
}

const handleGenerateShare = async (options: { expirationDays: number }) => {
  if (!currentShareFile.value) return
  
  isLoading.value = true
  try {
    const result = await shareStore.createShare(currentShareFile.value.id, options.expirationDays)
    if (result.success && result.data) {
      shareCode.value = result.data.shareCode
    } else {
      alert(result.error || '生成分享码失败')
      showShare.value = false
    }
  } catch (err) {
    alert('生成分享码失败，请稍后重试')
    showShare.value = false
  } finally {
    isLoading.value = false
  }
}

const handleCreateFolder = async () => {
  const folderName = prompt('请输入文件夹名称：')
  if (!folderName || !folderName.trim()) return
  
  isLoading.value = true
  try {
    const parentId = breadcrumbs.value.length > 0 
      ? breadcrumbs.value[breadcrumbs.value.length - 1]?.id 
      : null
    
    const result = await fileStore.createFolder(folderName.trim(), parentId)
    if (result.success) {
      await initFiles() // 刷新文件列表
    } else {
      alert(result.error || '创建文件夹失败')
    }
  } catch (error) {
    alert('创建文件夹失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const handleManageShare = (share: ShareRecord) => {
  const findFileById = (files: FileItem[], fileId: number): FileItem | null => {
    for (const f of files) {
      if (f.id === fileId) return f
      if (f.children) {
        const found = findFileById(f.children, fileId)
        if (found) return found
      }
    }
    return null
  }
  const file = findFileById(fileStore.files, share.fileId)
  if (file) {
    currentShareFile.value = file
    shareCode.value = share.shareCode
    showShareList.value = false
    showShare.value = true
  }
}

const handleFileUpload = async (files: File[]) => {
  isLoading.value = true
  try {
    const parentId = breadcrumbs.value.length > 0 
      ? breadcrumbs.value[breadcrumbs.value.length - 1]?.id 
      : null
    
    // 逐个上传文件
    for (const file of files) {
      const result = await fileStore.uploadFile(file, parentId)
      if (!result.success) {
        alert(`上传文件 "${file.name}" 失败: ${result.error}`)
      }
    }
    
    // 上传成功后刷新文件列表
    await initFiles()
    showUpload.value = false
  } catch (error) {
    alert('上传文件失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const handleFileAction = async (action: string | FileAction, file: FileItem) => {
  if (action === 'options') {
    toggleOptionsMenu(file.id)
    return
  }

  closeOptionsMenu()

  switch (action) {
    case '分享':
      if (file.type === 'folder') {
        alert('文件夹暂不支持分享功能')
        return
      }
      currentShareFile.value = file
      shareCode.value = ''
      showShare.value = true
      break
    case '下载':
      isLoading.value = true
      try {
        const result = await fileStore.downloadFile(file.id)
        if (!result.success) {
          alert(result.error || '下载失败')
        }
      } catch (error) {
        alert('下载失败，请稍后重试')
      } finally {
        isLoading.value = false
      }
      break
    case '重命名':
      const newName = prompt(`重命名 "${file.name}":`, file.name)
      if (newName && newName.trim() !== '' && newName !== file.name) {
        isLoading.value = true
        try {
          const result = await fileStore.renameFile(file.id, newName.trim())
          if (!result.success) {
            alert(result.error || '重命名失败')
          } else {
            await initFiles() // 刷新文件列表
          }
        } catch (error) {
          alert('重命名失败，请稍后重试')
        } finally {
          isLoading.value = false
        }
      }
      break
    case '删除':
      if (confirm(`确定要删除 "${file.name}" 吗？此操作不可恢复。`)) {
        isLoading.value = true
        try {
          const result = await fileStore.deleteFile(file.id)
          if (!result.success) {
            alert(result.error || '删除失败')
          }
        } catch (error) {
          alert('删除失败，请稍后重试')
        } finally {
          isLoading.value = false
        }
      }
      break
    case '收藏':
      isLoading.value = true
      try {
        const result = await fileStore.toggleStar(file.id, !file.starred)
        if (!result.success) {
          alert(result.error || '操作失败')
        }
      } catch (error) {
        alert('操作失败，请稍后重试')
      } finally {
        isLoading.value = false
      }
      break
    case '管理分享':
      // 查看或管理该文件的分享
      const existingShare = shareStore.getShareByFileId(file.id)
      if (existingShare) {
        // 如果已有分享，显示分享详情
        currentShareFile.value = file
        shareCode.value = existingShare.shareCode
        showShare.value = true
      } else {
        // 如果没有分享，创建新分享
        currentShareFile.value = file
        shareCode.value = ''
        showShare.value = true
      }
      break
  }
}
</script>

<template>
  <PageFrame no-padding :allow-overflow="false" :full-screen="true">
    <div class="absolute inset-0 flex flex-col md:flex-row overflow-hidden max-w-full">
      <Sidebar
        :menu-items="menuItems"
        :active-tab="activeTab"
        :username="username"
        user-role="高级账户"
        logo="S"
        logo-color="blue"
        @tab-change="activeTab = $event"
        @logout="handleLogout"
      >
        <template #title>SimpleShare</template>
      </Sidebar>

      <main class="flex-1 flex flex-col h-full overflow-hidden bg-slate-900/20 relative min-w-0 max-w-full">
        <header class="h-16 md:h-20 shrink-0 border-b border-white/5 flex items-center justify-between px-3 md:px-4 lg:px-8 gap-2 overflow-hidden">
          <div class="flex-1 min-w-0">
            <SearchBar v-model="searchQuery" />
          </div>
          <div class="flex items-center gap-2 md:gap-3 shrink-0">
            <ViewModeToggle v-model="viewMode" />
            <BaseButton
              v-if="activeTab === 'all'"
              variant="glass"
              class="!py-1.5 !px-2 md:!px-3 !text-xs hidden sm:inline-flex"
              @click="handleCreateFolder"
              title="新建文件夹"
            >
              <svg class="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span class="hidden md:inline">新建文件夹</span>
            </BaseButton>
            <BaseButton 
              v-if="activeTab === 'all'" 
              variant="primary" 
              class="!py-1.5 !px-2 md:!px-3 !text-xs" 
              @click="showUpload = true"
            >
              <span class="hidden sm:inline">上传</span>
              <svg class="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </BaseButton>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 lg:p-8 scrollbar-thin scrollbar-thumb-slate-700 relative">
          <div v-if="isLoading" class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <LoadingSpinner size="lg" text="处理中..." />
          </div>

          <!-- 只在全部文件标签页且不在根目录时显示面包屑 -->
          <Breadcrumb
            v-if="activeTab === 'all' && breadcrumbs.length > 0"
            :breadcrumbs="breadcrumbs"
            @navigate="navigateToBreadcrumb"
            @navigate-root="breadcrumbs = []"
          />

          <!-- 标签页提示 -->
          <div v-if="activeTab !== 'all' && breadcrumbs.length === 0" class="mb-4 text-sm text-slate-400">
            <span v-if="activeTab === 'recent'">📅 显示最近7天上传的文件</span>
            <span v-else-if="activeTab === 'starred'">⭐ 显示已收藏的文件</span>
            <span v-else-if="activeTab === 'shares'">🔗 显示已分享的文件</span>
          </div>

          <!-- 我的分享标签页 -->
          <div v-if="activeTab === 'shares'" class="space-y-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold text-white">我的分享</h3>
              <BaseButton variant="primary" class="!py-1.5 !px-3 !text-xs" @click="showShareList = true">
                管理所有分享
              </BaseButton>
            </div>
            <FileListView
              :files="currentFiles"
              :view-mode="viewMode"
              :active-options-menu="activeOptionsMenu"
              @file-click="handleFileClick"
              @file-action="handleFileAction"
            />
          </div>

          <!-- 其他标签页（最近上传、我的收藏、我的分享） -->
          <FileListView
            v-else
            :files="currentFiles"
            :view-mode="viewMode"
            :active-options-menu="activeOptionsMenu"
            @file-click="handleFileClick"
            @file-action="handleFileAction"
          />
        </div>
      </main>
    </div>
    <UploadModal
      :show="showUpload"
      @close="showUpload = false"
      @upload="handleFileUpload"
    />

    <ShareModal
      v-if="currentShareFile"
      :show="showShare"
      :file-name="currentShareFile.name"
      :share-code="shareCode"
      @close="showShare = false; currentShareFile = null; shareCode = ''"
      @generate="handleGenerateShare"
    />

    <ShareList
      :show="showShareList"
      @close="() => showShareList = false"
      @manage="handleManageShare"
    />
  </PageFrame>
</template>
