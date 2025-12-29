import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileItem } from '../types'
import { get, post, put, del } from '../api'

export const useFileStore = defineStore('file', () => {
  const files = ref<FileItem[]>([])
  const currentFolder = ref<FileItem | null>(null)
  const breadcrumbs = ref<FileItem[]>([])
  const searchQuery = ref('')
  const viewMode = ref<'list' | 'grid'>('grid')
  const activeTab = ref('all')

  const getAllFilesFlat = (fileList: FileItem[]): FileItem[] => {
    const result: FileItem[] = []
    fileList.forEach(file => {
      result.push(file)
      if (file.children) {
        result.push(...getAllFilesFlat(file.children))
      }
    })
    return result
  }

  const getFilesByTab = (fileList: FileItem[]): FileItem[] => {
    switch (activeTab.value) {
      case 'recent':
        const allFilesFlat = getAllFilesFlat(fileList)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return allFilesFlat
          .filter(f => {
            try {
              const fileDate = new Date(f.date)
              return fileDate >= sevenDaysAgo && f.type !== 'folder'
            } catch {
              return false
            }
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      case 'starred':
        return getAllFilesFlat(fileList).filter(f => f.starred)
      
      case 'shares':
        return []
      
      case 'all':
      default:
        return fileList
    }
  }

  const currentFiles = computed(() => {
    let filesToShow: FileItem[] = []
    
    if (breadcrumbs.value.length > 0) {
      const currentFolder = breadcrumbs.value[breadcrumbs.value.length - 1]
      if (currentFolder) {
        filesToShow = currentFolder.children || []
      }
    } else {
      filesToShow = getFilesByTab(files.value)
    }

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      filesToShow = filesToShow.filter(f => f.name.toLowerCase().includes(q))
    }
    
    return filesToShow
  })

  const navigateToFolder = (folder: FileItem) => {
    if (folder.type !== 'folder') return
    breadcrumbs.value.push(folder)
    searchQuery.value = ''
  }

  const navigateToBreadcrumb = (index: number) => {
    breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
  }

  const navigateToRoot = () => {
    breadcrumbs.value = []
    searchQuery.value = ''
  }

  const addFile = (file: FileItem) => {
    files.value.push(file)
  }

  const removeFile = (fileId: number) => {
    const removeFromList = (fileList: FileItem[]): boolean => {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        if (file && file.id === fileId) {
          fileList.splice(i, 1)
          return true
        }
        if (file && file.children) {
          if (removeFromList(file.children)) {
            return true
          }
        }
      }
      return false
    }
    removeFromList(files.value)
  }

  const updateFile = (fileId: number, updates: Partial<FileItem>) => {
    const updateInList = (fileList: FileItem[]): boolean => {
      for (const file of fileList) {
        if (file.id === fileId) {
          Object.assign(file, updates)
          return true
        }
        if (file.children) {
          if (updateInList(file.children)) {
            return true
          }
        }
      }
      return false
    }
    updateInList(files.value)
  }

  const setFiles = (fileList: FileItem[]) => {
    files.value = fileList
  }

  const setActiveTab = (tab: string) => {
    activeTab.value = tab as 'all' | 'recent' | 'starred' | 'shares'
    breadcrumbs.value = []
    searchQuery.value = ''
  }

  const fetchFiles = async (parentId?: number | null) => {
    try {
      const params = new URLSearchParams()
      if (parentId !== undefined && parentId !== null) {
        params.append('parentId', parentId.toString())
      }
      params.append('tab', activeTab.value)

      const response = await get<FileItem[]>(`/files/list?${params.toString()}`)
      
      if (response.success && response.data) {
        const transformFile = (file: any): FileItem => ({
          id: file.id,
          name: file.name,
          size: file.size || '-',
          date: file.date || new Date(file.created_at || file.uploadTime).toISOString().split('T')[0],
          type: file.type,
          starred: file.starred || false,
          children: file.children ? file.children.map(transformFile) : undefined,
          mimeType: file.mimeType || file.mime_type,
          uploadTime: file.uploadTime || file.created_at,
          storageKey: file.storageKey || file.storage_key,
          userId: file.userId || file.user_id,
          downloadCount: file.downloadCount || file.download_count
        })
        
        files.value = response.data.map(transformFile)
        return { success: true }
      } else {
        return { success: false, error: response.error || '获取文件列表失败' }
      }
    } catch (error) {
      return { success: false, error: '网络错误' }
    }
  }

  const uploadFile = async (file: File, parentId?: number | null, _onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    if (parentId !== undefined && parentId !== null) {
      formData.append('parentId', parentId.toString())
    }

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        await fetchFiles(parentId)
        return { success: true, data: data.data }
      }
      return { success: false, error: data.error || '上传失败' }
    } catch (error) {
      return { success: false, error: '网络错误' }
    }
  }

  const createFolder = async (name: string, parentId?: number | null) => {
    const response = await post<FileItem>('/files/folders', { name, parentId })
    if (response.success && response.data) {
      await fetchFiles(parentId)
      return { success: true, data: response.data }
    }
    return { success: false, error: response.error || '创建文件夹失败' }
  }

  const deleteFile = async (fileId: number) => {
    const response = await del(`/files/${fileId}`)
    if (response.success) {
      removeFile(fileId)
      const parentId = breadcrumbs.value.length > 0 
        ? breadcrumbs.value[breadcrumbs.value.length - 1]?.id 
        : null
      await fetchFiles(parentId)
      return { success: true }
    }
    return { success: false, error: response.error || '删除失败' }
  }

  const renameFile = async (fileId: number, newName: string) => {
    const response = await put(`/files/${fileId}`, { name: newName })
    if (response.success) {
      updateFile(fileId, { name: newName })
      return { success: true }
    }
    return { success: false, error: response.error || '重命名失败' }
  }

  const toggleStar = async (fileId: number, starred: boolean) => {
    const response = await put(`/files/${fileId}`, { starred })
    if (response.success) {
      updateFile(fileId, { starred })
      return { success: true }
    }
    return { success: false, error: response.error || '操作失败' }
  }

  const moveFiles = async (fileIds: number[], targetFolderId: number | null) => {
    try {
      const response = await post('/files/move', {
        fileIds,
        targetFolderId
      })
      if (response.success) {
        // 刷新文件列表
        const parentId = breadcrumbs.value.length > 0 
          ? breadcrumbs.value[breadcrumbs.value.length - 1]?.id 
          : null
        await fetchFiles(parentId)
        return { success: true }
      }
      return { success: false, error: response.error || '移动失败' }
    } catch (error) {
      return { success: false, error: '网络错误' }
    }
  }

  const downloadFile = async (fileId: number, shareCode?: string) => {
    try {
      const params = new URLSearchParams()
      params.append('id', fileId.toString())
      if (shareCode) {
        params.append('shareCode', shareCode)
      }

      const token = localStorage.getItem('authToken')
      const url = `/api/files/download?${params.toString()}`
      
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '下载失败')
      }

      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'download'
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="?(.+?)"?/i)
        if (matches && matches[1]) {
          filename = matches[1]
        }
      }

      const blob = await response.blob()
      const urlObj = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = urlObj
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(urlObj)

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '下载失败' }
    }
  }

  return {
    files,
    currentFolder,
    breadcrumbs,
    searchQuery,
    viewMode,
    activeTab,
    currentFiles,
    navigateToFolder,
    navigateToBreadcrumb,
    navigateToRoot,
    addFile,
    removeFile,
    updateFile,
    setFiles,
    setActiveTab,
    fetchFiles,
    uploadFile,
    createFolder,
    deleteFile,
    renameFile,
    toggleStar,
    downloadFile,
    moveFiles
  }
})

