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
const showMoveModal = ref(false)
const currentShareFile = ref<FileItem | null>(null)
const shareCode = ref('')
const activeOptionsMenu = ref<number | null>(null)
const isLoading = ref(false)
const selectedFiles = ref<number[]>([])
const moveTargetFolder = ref<number | null>(null)

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
  // 在移动模式下，只显示文件夹
  if (showMoveModal.value) {
    return fileStore.currentFiles.filter(f => f.type === 'folder')
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
  // 保存当前选中的文件，然后打开移动模式
  openMoveModal()
}

const confirmMoveFiles = async () => {
  if (selectedFiles.value.length === 0) {
    alert('请先选择要移动的文件')
    return
  }
  
  // 获取当前目录ID（面包屑最后一个，或null表示根目录）
  const lastBreadcrumb = breadcrumbs.value.length > 0 
    ? breadcrumbs.value[breadcrumbs.value.length - 1] 
    : null
  const currentFolderId = lastBreadcrumb?.id ?? null
  
  isLoading.value = true
  try {
    const filesToMove = selectedFiles.value.length
    const result = await fileStore.moveFiles(selectedFiles.value, currentFolderId)
    if (result.success) {
      // 先关闭模态框
      showMoveModal.value = false
      // 返回原目录
      fileStore.navigateToRoot()
      // 如果之前保存了目录，导航回去
      if (moveTargetFolder.value !== null) {
        // 重新加载所有文件
        await fileStore.fetchFiles(null)
        const allFiles = fileStore.files
        const findFolder = (files: typeof allFiles, folderId: number): FileItem | null => {
          for (const file of files) {
            if (file.id === folderId && file.type === 'folder') return file
            if (file.children) {
              const found = findFolder(file.children, folderId)
              if (found) return found
            }
          }
          return null
        }
        const savedFolder = findFolder(allFiles, moveTargetFolder.value)
        if (savedFolder) {
          fileStore.navigateToFolder(savedFolder)
        }
      }
      // 刷新文件列表
      await initFiles()
      // 清空选中的文件
      selectedFiles.value = []
      moveTargetFolder.value = null
      alert(`成功移动 ${filesToMove} 个文件`)
    } else {
      alert(result.error || '移动失败')
    }
  } catch (error) {
    alert('移动失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const openMoveModal = async () => {
  // 保存当前目录，用于移动后返回
  const lastBreadcrumb = breadcrumbs.value.length > 0 
    ? breadcrumbs.value[breadcrumbs.value.length - 1] 
    : null
  moveTargetFolder.value = lastBreadcrumb?.id ?? null
  // 重置到根目录，以便选择目标文件夹
  fileStore.navigateToRoot()
  // 确保加载了所有文件（包括文件夹）
  await initFiles()
  showMoveModal.value = true
}

// 在移动模式下，点击文件夹应该进入该文件夹
const handleMoveModeFolderClick = async (folder: FileItem) => {
  if (showMoveModal.value && folder.type === 'folder') {
    fileStore.navigateToFolder(folder)
    // 导航后重新加载文件列表
    await initFiles()
  }
}

// 关闭移动模态框
const handleCloseMoveModal = () => {
  showMoveModal.value = false
  // 返回根目录
  fileStore.navigateToRoot()
  // 如果之前保存了目录，导航回去
  if (moveTargetFolder.value !== null) {
    // 重新加载所有文件
    fileStore.fetchFiles(null).then(() => {
      const allFiles = fileStore.files
      const findFolder = (files: typeof allFiles, folderId: number): FileItem | null => {
        for (const file of files) {
          if (file.id === folderId && file.type === 'folder') return file
          if (file.children) {
            const found = findFolder(file.children, folderId)
            if (found) return found
          }
        }
        return null
      }
      const savedFolder = findFolder(allFiles, moveTargetFolder.value!)
      if (savedFolder) {
        fileStore.navigateToFolder(savedFolder)
        initFiles()
      } else {
        initFiles()
      }
    })
  } else {
    initFiles()
  }
  moveTargetFolder.value = null
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
    <div class="flex flex-col md:flex-row h-full w-full overflow-hidden relative">
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

      <main class="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <header class="h-20 md:h-28 shrink-0 flex items-center justify-between px-6 md:px-12 gap-4 overflow-hidden relative z-10">
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

        <div class="flex-1 overflow-y-auto custom-scrollbar relative z-0">
          <div v-if="isLoading" class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <LoadingSpinner size="lg" text="处理中..." />
          </div>

          <div class="p-6 md:p-12 space-y-4 md:space-y-6">
            <!-- 在全部文件标签页显示面包屑（包括根目录） -->
            <div v-if="activeTab === 'all'" class="shrink-0">
              <Breadcrumb
                :breadcrumbs="breadcrumbs"
                @navigate="navigateToBreadcrumb"
                @navigate-root="() => fileStore.navigateToRoot()"
              />
            </div>

            <!-- 标签页提示 -->
            <div v-if="activeTab !== 'all'" class="shrink-0 text-sm text-slate-400">
              <span v-if="activeTab === 'recent'">📅 显示最近7天上传的文件</span>
              <span v-else-if="activeTab === 'starred'">⭐ 显示已收藏的文件</span>
              <span v-else-if="activeTab === 'shares'">🔗 显示已分享的文件</span>
            </div>

            <!-- 我的分享标签页 -->
            <div v-if="activeTab === 'shares'" class="space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-bold text-white">我的分享</h3>
                <BaseButton variant="primary" class="!py-1.5 !px-3 !text-xs" @click="showShareList = true">
                  管理所有分享
                </BaseButton>
              </div>
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

            <!-- 其他标签页（最近上传、我的收藏、全部文件） -->
            <FileListView
              v-else
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
    <BaseModal
      v-if="showMoveModal"
      :show="showMoveModal"
      title="选择目标文件夹"
      width="max-w-2xl"
      @close="handleCloseMoveModal"
    >
      <div class="space-y-4">
        <p class="text-sm text-slate-300">
          已选择 <span class="font-semibold text-white">{{ selectedFiles.length }}</span> 个文件
        </p>
        
        <!-- 面包屑导航 -->
        <div class="flex items-center gap-2 text-xs text-slate-400">
          <button
            @click="fileStore.navigateToRoot()"
            class="hover:text-white px-2 py-1 rounded hover:bg-white/5"
          >
            根目录
          </button>
          <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
            <span>/</span>
            <button
              @click="fileStore.navigateToBreadcrumb(index)"
              class="hover:text-white px-2 py-1 rounded hover:bg-white/5 truncate max-w-[150px]"
              :title="crumb.name"
            >
              {{ crumb.name }}
            </button>
          </template>
        </div>

        <!-- 文件夹列表 -->
        <div class="bg-white/5 border border-white/10 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div v-if="currentFiles.filter(f => f.type === 'folder').length === 0 && breadcrumbs.length === 0" class="text-center text-slate-400 py-8">
            <p>当前目录下没有文件夹</p>
            <p class="text-xs mt-2">文件将移动到根目录</p>
          </div>
          <div
            v-for="folder in currentFiles.filter(f => f.type === 'folder')"
            :key="folder.id"
            @click="handleMoveModeFolderClick(folder)"
            class="w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors cursor-pointer flex items-center gap-3 hover:bg-white/10 border border-transparent hover:border-white/10"
          >
            <svg class="w-5 h-5 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.165 19.551c.086.58.586 1.01 1.173 1.01h17.324c.587 0 1.087-.43 1.173-1.01l1.161-7.854c.099-.672-.42-1.282-1.096-1.282H2.099c-.676 0-1.195.61-1.096 1.282l1.162 7.854z" opacity=".4"></path>
              <path d="M3.338 10.415h17.324c.969 0 1.713.874 1.571 1.833L21.071 20.1c-.086.58-.586 1.01-1.173 1.01H4.101c-.587 0-1.087-.43-1.173-1.01L1.767 12.248c-.142-.959.602-1.833 1.571-1.833z"></path>
            </svg>
            <span class="text-white font-medium flex-1">{{ folder.name }}</span>
            <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <!-- 当前目录提示 -->
        <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
          <p class="text-blue-300">
            <span class="font-semibold">当前目录：</span>
            <span v-if="breadcrumbs.length === 0">根目录</span>
            <span v-else>{{ breadcrumbs[breadcrumbs.length - 1]?.name }}</span>
          </p>
          <p class="text-blue-400/80 text-xs mt-1">文件将移动到此目录</p>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="glass" @click="handleCloseMoveModal" :disabled="isLoading">
            取消
          </BaseButton>
          <BaseButton 
            variant="primary" 
            @click="confirmMoveFiles" 
            :loading="isLoading" 
            :disabled="isLoading"
          >
            确认移动到当前目录
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </PageFrame>
</template>

