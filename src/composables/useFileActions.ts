import { ref } from 'vue'
import { useFileStore } from '../stores'
import type { FileItem } from '../types'

export function useFileActions() {
  const fileStore = useFileStore()
  const isLoading = ref(false)

  const downloadFile = async (file: FileItem) => {
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
  }

  const deleteFile = async (file: FileItem) => {
    if (!confirm(`确定要删除 "${file.name}" 吗？此操作不可恢复。`)) return false
    
    isLoading.value = true
    try {
      const result = await fileStore.deleteFile(file.id)
      if (!result.success) {
        alert(result.error || '删除失败')
        return false
      }
      return true
    } catch (error) {
      alert('删除失败，请稍后重试')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const deleteFiles = async (fileIds: number[]) => {
    if (!confirm(`确定要删除选中的 ${fileIds.length} 个项目吗？此操作不可恢复。`)) return false
    
    isLoading.value = true
    try {
      const result = await fileStore.deleteFiles(fileIds)
      if (!result.success) {
        alert(result.error || '批量删除失败')
        return false
      }
      return true
    } catch (error) {
      alert('批量删除失败，请稍后重试')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const renameFile = async (file: FileItem) => {
    const newName = prompt(`重命名 "${file.name}":`, file.name)
    if (!newName || newName.trim() === '' || newName === file.name) return false

    isLoading.value = true
    try {
      const result = await fileStore.renameFile(file.id, newName.trim())
      if (!result.success) {
        alert(result.error || '重命名失败')
        return false
      }
      // 刷新列表通常在组件层处理
      return true
    } catch (error) {
      alert('重命名失败，请稍后重试')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const toggleStar = async (file: FileItem) => {
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
  }

  const createFolder = async (parentId: number | null) => {
    const folderName = prompt('请输入文件夹名称：')
    if (!folderName || !folderName.trim()) return false
    
    isLoading.value = true
    try {
      const result = await fileStore.createFolder(folderName.trim(), parentId)
      if (result.success) {
        return true
      } else {
        alert(result.error || '创建文件夹失败')
        return false
      }
    } catch (error) {
      alert('创建文件夹失败，请稍后重试')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const uploadFiles = async (files: File[], parentId: number | null) => {
    isLoading.value = true
    let successCount = 0
    try {
      for (const file of files) {
        const result = await fileStore.uploadFile(file, parentId)
        if (result.success) {
          successCount++
        } else {
          alert(`上传文件 "${file.name}" 失败: ${result.error}`)
        }
      }
      return successCount > 0
    } catch (error) {
      alert('上传文件失败，请稍后重试')
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    downloadFile,
    deleteFile,
    renameFile,
    toggleStar,
    createFolder,
    uploadFiles
  }
}

