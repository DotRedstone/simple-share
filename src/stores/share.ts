import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get, post, del } from '../api'

export interface ShareRecord {
  id: string
  fileId: number
  shareCode: string
  expirationDays: number
  createdAt: string
  expiresAt: string
  accessCount: number
  maxAccess?: number
}

export const useShareStore = defineStore('share', () => {
  const shares = ref<ShareRecord[]>([])

  const fetchUserShares = async () => {
    const response = await get<ShareRecord[]>('/shares/list')
    if (response.success && response.data) {
      shares.value = response.data
    }
  }

  const createShare = async (fileId: number, expirationDays: number = 7): Promise<{ success: boolean; data?: ShareRecord; error?: string }> => {
    const response = await post<{ id: string; shareCode: string; expiresAt: string }>('/shares/create', {
      fileId,
      expirationDays
    })
    
    if (response.success && response.data) {
      const share: ShareRecord = {
        id: response.data.id,
        fileId,
        shareCode: response.data.shareCode,
        expirationDays,
        createdAt: new Date().toISOString(),
        expiresAt: response.data.expiresAt,
        accessCount: 0
      }
      shares.value.push(share)
      return { success: true, data: share }
    }
    return { success: false, error: response.error || '创建分享失败' }
  }

  const getShareByCode = async (code: string): Promise<ShareRecord | null> => {
    const localShare = shares.value.find(s => s.shareCode === code && new Date(s.expiresAt) > new Date())
    if (localShare) return localShare

    try {
      const response = await fetch(`/api/extract/${code}`)
      const data = await response.json()
      if (data.success) {
        return null
      }
    } catch {
      // 忽略错误
    }
    return null
  }

  const incrementAccess = (shareCode: string) => {
    const share = shares.value.find(s => s.shareCode === shareCode)
    if (share) {
      share.accessCount++
    }
  }

  const deleteShare = async (shareId: string): Promise<{ success: boolean; error?: string }> => {
    const response = await del(`/shares/${shareId}`)
    if (response.success) {
      shares.value = shares.value.filter(s => s.id !== shareId)
      return { success: true }
    }
    return { success: false, error: response.error || '删除分享失败' }
  }

  const getShareByFileId = (fileId: number): ShareRecord | undefined => {
    return shares.value.find(s => s.fileId === fileId && new Date(s.expiresAt) > new Date())
  }

  const getUserShares = (): ShareRecord[] => {
    return shares.value.filter(s => new Date(s.expiresAt) > new Date())
  }

  const deleteShareByFileId = async (fileId: number): Promise<{ success: boolean; error?: string }> => {
    const share = shares.value.find(s => s.fileId === fileId)
    if (share) {
      return await deleteShare(share.id)
    }
    return { success: false, error: '分享不存在' }
  }

  return {
    shares,
    fetchUserShares,
    createShare,
    getShareByCode,
    getShareByFileId,
    getUserShares,
    incrementAccess,
    deleteShare,
    deleteShareByFileId
  }
})

