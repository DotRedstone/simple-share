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
import MoveFilesModal from '../components/MoveFilesModal.vue'
import ExtractModal from '../components/ExtractModal.vue'
import { useFileActions } from '../composables/useFileActions'

const router = useRouter()
const authStore = useAuthStore()
const fileStore = useFileStore()
const shareStore = useShareStore()
const { 
  isLoading: isActionLoading, 
  downloadFile, 
  deleteFile, 
  renameFile, 
  toggleStar,
  createFolder,
  uploadFiles
} = useFileActions()

const showUpload = ref(false)
const showShare = ref(false)
const showShareList = ref(false)
const showMoveModal = ref(false)
const showExtractModal = ref(false)
const currentShareFile = ref<FileItem | null>(null)
const shareCode = ref('')
const activeOptionsMenu = ref<number | null>(null)
const isLoading = ref(false)
const selectedFiles = ref<number[]>([])

const combinedLoading = computed(() => isLoading.value || isActionLoading.value)

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

// 主界面的文件列表
const currentFiles = computed(() => fileStore.currentFiles)

const menuItems: MenuItem[] = [
  { id: 'all', label: '全部文件', icon: 'folder' },
  { id: 'recent', label: '最近上传', icon: 'clock' },
  { id: 'starred', label: '我的收藏', icon: 'star' },
  { id: 'shares', label: '我的分享', icon: 'share' },
  { id: 'extract', label: '提取文件', icon: 'download' },
]

const handleTabChange = (tabId: string) => {
  if (tabId === 'extract') {
    showExtractModal.value = true
  } else {
    activeTab.value = tabId
  }
}

const initFiles = async () => {
  isLoading.value = true
  try {
    const result = await fileStore.fetchFiles(fileStore.currentFolderId)
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
  initFiles()
}

const navigateToRoot = () => {
  fileStore.navigateToRoot()
  initFiles()
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
  selectedFiles.value = [] // 切换标签页时清空选择
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
    initFiles()
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
  if (await createFolder(fileStore.currentFolderId)) {
    await initFiles()
  }
}

const handleManageShare = (share: ShareRecord) => {
  const file = fileStore.findFileById(fileStore.files, share.fileId)
  if (file) {
    currentShareFile.value = file
    shareCode.value = share.shareCode
    showShareList.value = false
    showShare.value = true
  }
}

const handleFileUpload = async (files: File[]) => {
  if (await uploadFiles(files, fileStore.currentFolderId)) {
    await initFiles()
    showUpload.value = false
  }
}

const handleFileSelect = (fileId: number, selected: boolean) => {
  if (selected) {
    if (!selectedFiles.value.includes(fileId)) {
      selectedFiles.value.push(fileId)
    }
  } else {
    selectedFiles.value = selectedFiles.value.filter(id => id !== fileId)
  }
}

const handleSelectAll = (selected: boolean) => {
  if (selected) {
    selectedFiles.value = currentFiles.value.map(f => f.id)
  } else {
    selectedFiles.value = []
  }
}

const handleMoveFiles = () => {
  if (selectedFiles.value.length === 0) {
    alert('请先选择要移动的文件')
    return
  }
  showMoveModal.value = true
}

const onMoveSuccess = async () => {
  showMoveModal.value = false
  selectedFiles.value = []
  await initFiles()
  alert('文件移动成功')
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
      await downloadFile(file)
      break
    case '重命名':
      if (await renameFile(file)) {
        await initFiles()
      }
      break
    case '删除':
      if (await deleteFile(file)) {
        selectedFiles.value = selectedFiles.value.filter(id => id !== file.id)
        await initFiles()
      }
      break
    case '收藏':
      await toggleStar(file)
      break
    case '管理分享': {
      const existingShare = shareStore.getShareByFileId(file.id)
      currentShareFile.value = file
      shareCode.value = existingShare?.shareCode || ''
      showShare.value = true
      break
    }
  }
}
</script>

<template>
  <PageFrame no-padding :allow-overflow="false" :full-screen="true">
    <div class="flex flex-col md:flex-row h-full w-full overflow-hidden relative">
      <Sidebar
        :menu-items="menuItems"
        :active-tab="activeTab"
        :username="username"
        user-role="高级账户"
        logo="S"
        logo-color="blue"
        @tab-change="handleTabChange"
        @logout="handleLogout"
      />

      <main class="flex-1 flex flex-col min-h-0 overflow-hidden relative h-full">
        <header class="h-20 md:h-28 shrink-0 flex items-center justify-between px-6 md:px-12 gap-4 overflow-hidden relative z-10 border-b border-white/5 bg-surface-900/40 backdrop-blur-md">
          <div class="flex-1 min-w-0">
            <SearchBar v-model="searchQuery" />
          </div>
          <div class="flex items-center gap-4 shrink-0">
            <ViewModeToggle v-model="viewMode" />
            <div class="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block"></div>
            
            <BaseButton
              v-if="activeTab === 'all' && selectedFiles.length > 0"
              variant="glass"
              @click="handleMoveFiles"
              title="移动选中文件"
              class="!px-3 sm:!px-5"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span class="ml-2 text-xs sm:text-sm">{{ selectedFiles.length }}</span>
            </BaseButton>

            <BaseButton
              v-if="activeTab === 'all'"
              variant="glass"
              @click="handleCreateFolder"
              class="shadow-xl !px-3 sm:!px-5"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <span class="hidden sm:inline ml-2 text-sm">新建文件夹</span>
            </BaseButton>

            <BaseButton
              v-if="activeTab === 'all'"
              variant="primary"
              @click="showUpload = true"
              class="shadow-xl shadow-brand-primary/20 !px-3 sm:!px-5"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" />
              </svg>
              <span class="hidden sm:inline ml-2 text-sm">上传文件</span>
            </BaseButton>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto custom-scrollbar relative z-0 bg-surface-950/20">
          <div v-if="combinedLoading" class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <LoadingSpinner size="lg" text="处理中..." />
          </div>

          <div class="min-h-full flex flex-col p-6 md:p-12 space-y-4 md:space-y-6">
            <!-- 在全部文件标签页显示面包屑（包括根目录） -->
            <div v-if="activeTab === 'all'" class="shrink-0">
              <Breadcrumb
                :breadcrumbs="breadcrumbs"
                @navigate="navigateToBreadcrumb"
                @navigate-root="navigateToRoot"
              />
            </div>

            <!-- 标签页提示 -->
            <div v-if="activeTab !== 'all'" class="shrink-0 text-sm text-slate-400">
              <span v-if="activeTab === 'recent'">📅 显示最近7天上传的文件</span>
              <span v-else-if="activeTab === 'starred'">⭐ 显示已收藏的文件</span>
              <span v-else-if="activeTab === 'shares'">🔗 显示已分享的文件</span>
            </div>

            <div class="flex-1 flex flex-col">
              <!-- 我的分享标签页 -->
              <div v-if="activeTab === 'shares'" class="flex-1 flex flex-col space-y-4">
                <div class="flex justify-between items-center shrink-0">
                  <h3 class="text-lg font-bold text-white">我的分享</h3>
                  <BaseButton variant="primary" class="!py-1.5 !px-3 !text-xs" @click="showShareList = true">
                    管理所有分享
                  </BaseButton>
                </div>
                <div class="flex-1">
                  <FileListView
                    :files="currentFiles"
                    :view-mode="viewMode"
                    :active-options-menu="activeOptionsMenu"
                    :selected-files="selectedFiles"
                    @file-click="handleFileClick"
                    @file-action="handleFileAction"
                    @file-select="handleFileSelect"
                    @select-all="handleSelectAll"
                  />
                </div>
              </div>

              <!-- 其他标签页（最近上传、我的收藏、全部文件） -->
              <div v-else class="flex-1">
                <FileListView
                  :files="currentFiles"
                  :view-mode="viewMode"
                  :active-options-menu="activeOptionsMenu"
                  :selected-files="activeTab === 'all' ? selectedFiles : []"
                  :enable-multi-select="activeTab === 'all'"
                  @file-click="handleFileClick"
                  @file-action="handleFileAction"
                  @file-select="activeTab === 'all' ? handleFileSelect : () => {}"
                  @select-all="activeTab === 'all' ? handleSelectAll : () => {}"
                />
              </div>
            </div>
          </div>
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

    <!-- 移动文件模态框 -->
    <MoveFilesModal
      v-if="showMoveModal"
      :show="showMoveModal"
      :selected-files="selectedFiles"
      @close="showMoveModal = false"
      @success="onMoveSuccess"
    />

    <ExtractModal
      :show="showExtractModal"
      @close="showExtractModal = false"
    />
  </PageFrame>
</template>

