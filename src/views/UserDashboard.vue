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
  deleteFiles,
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
const isInitialized = ref(false)
const selectedFiles = ref<number[]>([])
const sortBy = ref('created_at')
const order = ref<'ASC' | 'DESC'>('DESC')

const handleSort = (field: string) => {
  if (sortBy.value === field) {
    order.value = order.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = field
    order.value = 'DESC'
  }
  initFiles()
}

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
  if (!authStore.isAuthenticated || isLoading.value) return
  
  isLoading.value = true
  try {
    const result = await fileStore.fetchFiles(fileStore.currentFolderId, sortBy.value, order.value)
    if (!result.success) {
      fileStore.setFiles([])
    }
  } catch (error) {
    fileStore.setFiles([])
  } finally {
    // 稍微延迟关闭加载状态，防止极短时间内的状态剧烈震荡
    setTimeout(() => {
      isLoading.value = false
    }, 50)
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

onMounted(async () => {
  // authStore.initAuth() // 已经在路由守卫中处理，无需重复调用
  await initFiles()
  isInitialized.value = true
  document.addEventListener('click', closeOptionsMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeOptionsMenu)
})

watch(() => activeTab.value, (newTab, oldTab) => {
  if (!isInitialized.value) return
  if (newTab === oldTab) return
  
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
  // 如果当前是全部文件且正在进行多选操作（按住 Ctrl/Cmd，或者已经有选中的文件）
  // 这种逻辑可以让用户点击文件直接选中，如果是文件夹则需要特殊处理
  
  const isSelected = selectedFiles.value.includes(file.id)
  
  if (isSelected) {
    selectedFiles.value = selectedFiles.value.filter(id => id !== file.id)
  } else {
    // 如果点击的是文件夹且没有其他文件被选中，则进入文件夹
    if (file.type === 'folder' && selectedFiles.value.length === 0) {
      fileStore.navigateToFolder(file)
      initFiles()
      return
    }
    // 否则加入选中列表
    selectedFiles.value.push(file.id)
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

const handleBatchDelete = async () => {
  if (selectedFiles.value.length === 0) {
    alert('请先选择要删除的文件')
    return
  }
  if (await deleteFiles(selectedFiles.value)) {
    selectedFiles.value = []
    await initFiles()
  }
}

const handleBatchStar = async () => {
  if (selectedFiles.value.length === 0) return
  isLoading.value = true
  try {
    let success = false
    for (const id of selectedFiles.value) {
      const file = currentFiles.value.find(f => f.id === id)
      if (file) {
        const result = await fileStore.toggleStar(id, !file.starred)
        if (result.success) success = true
      }
    }
    if (success) await initFiles()
  } finally {
    isLoading.value = false
  }
}

const handleBatchDownload = async () => {
  if (selectedFiles.value.length === 0) return
  for (const id of selectedFiles.value) {
    const file = currentFiles.value.find(f => f.id === id)
    if (file && file.type !== 'folder') {
      await downloadFile(file)
    }
  }
}

const handleBatchShare = () => {
  if (selectedFiles.value.length === 1) {
    const file = currentFiles.value.find(f => f.id === selectedFiles.value[0])
    if (file) {
      handleFileAction('分享', file)
    }
  }
}

const handleSingleRename = () => {
  if (selectedFiles.value.length === 1) {
    const file = currentFiles.value.find(f => f.id === selectedFiles.value[0])
    if (file) {
      handleFileAction('重命名', file)
    }
  }
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
    case '移动':
      selectedFiles.value = [file.id]
      showMoveModal.value = true
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

      <main class="flex-1 flex flex-col min-h-0 overflow-hidden relative h-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50">
        <header class="h-auto py-4 md:h-28 shrink-0 flex flex-col md:flex-row md:items-center justify-between px-4 md:px-12 gap-4 overflow-hidden relative z-10 border-b border-white/5 dark:bg-surface-900/40 dark:backdrop-blur-md light:bg-white light:border-slate-200">
          <div class="flex-1 min-w-0 w-full md:w-auto">
            <SearchBar v-model="searchQuery" />
          </div>
          <div class="flex items-center gap-2 sm:gap-4 shrink-0 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <!-- 批量操作按钮组 -->
            <template v-if="activeTab === 'all' && selectedFiles.length > 0">
              <div class="flex items-center gap-1 sm:gap-2 bg-white/5 dark:bg-white/5 p-1 rounded-xl border border-white/10 light:bg-slate-100 light:border-slate-200">
                <!-- 针对单选的操作 -->
                <template v-if="selectedFiles.length === 1">
                  <BaseButton
                    variant="glass"
                    @click="handleBatchShare"
                    title="分享"
                    class="!p-2 text-slate-300 dark:text-slate-300 hover:text-white light:text-slate-600 light:hover:text-slate-900"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </BaseButton>
                  <BaseButton
                    variant="glass"
                    @click="handleSingleRename"
                    title="重命名"
                    class="!p-2 text-slate-300 dark:text-slate-300 hover:text-white light:text-slate-600 light:hover:text-slate-900"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 5.232z" />
                    </svg>
                  </BaseButton>
                </template>

                <BaseButton
                  variant="glass"
                  @click="handleBatchStar"
                  title="收藏/取消收藏"
                  class="!p-2 text-slate-300 dark:text-slate-300 hover:text-yellow-400 light:text-slate-600 light:hover:text-yellow-600"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </BaseButton>

                <BaseButton
                  variant="glass"
                  @click="handleBatchDownload"
                  title="下载文件"
                  class="!p-2 text-slate-300 dark:text-slate-300 hover:text-white light:text-slate-600 light:hover:text-slate-900"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </BaseButton>

                <BaseButton
                  variant="glass"
                  @click="handleMoveFiles"
                  title="移动"
                  class="!p-2 text-slate-300 dark:text-slate-300 hover:text-white light:text-slate-600 light:hover:text-slate-900"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </BaseButton>

                <div class="w-[1px] h-4 bg-white/10 dark:bg-white/10 mx-1 light:bg-slate-200"></div>

                <BaseButton
                  variant="glass"
                  @click="handleBatchDelete"
                  title="删除"
                  class="!p-2 text-red-400 dark:text-red-400 hover:text-red-300 light:text-red-500 light:hover:text-red-600"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </BaseButton>
              </div>
              <div class="h-8 w-[1px] bg-white/10 dark:bg-white/10 mx-2 hidden sm:block light:bg-slate-200"></div>
            </template>

            <ViewModeToggle v-model="viewMode" />

            <BaseButton
              v-if="activeTab === 'all'"
              variant="glass"
              @click="handleCreateFolder"
              class="shadow-xl !px-3 sm:!px-5 light:bg-white light:text-slate-700 light:border-slate-200"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <span class="hidden sm:inline ml-2 text-sm">新建</span>
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
              <span class="hidden sm:inline ml-2 text-sm">上传</span>
            </BaseButton>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto custom-scrollbar relative z-0 bg-surface-950/20 dark:bg-surface-950/20 light:bg-transparent">
          <div v-if="combinedLoading" class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-20 flex items-center justify-center dark:bg-slate-900/50 light:bg-white/50">
            <LoadingSpinner size="lg" text="处理中..." />
          </div>

          <div class="min-h-full flex flex-col p-4 md:p-12 space-y-4 md:space-y-6 pb-24 md:pb-32">
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
                    :sort-by="sortBy"
                    :order="order"
                    @sort="handleSort"
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
                  :sort-by="sortBy"
                  :order="order"
                  @sort="handleSort"
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

