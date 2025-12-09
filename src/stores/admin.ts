import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserGroup, SystemLog, StorageStats, StatCard } from '../types'
import { get, post, put, del } from '../api'

export const useAdminStore = defineStore('admin', () => {
  const users = ref<User[]>([])
  const userGroups = ref<UserGroup[]>([])
  const logs = ref<SystemLog[]>([])
  const storageStats = ref<StorageStats>({
    totalStorage: 0,
    usedStorage: 0,
    availableStorage: 0,
    r2Buckets: 0,
    totalFiles: 0,
    totalSize: 0
  })

  const formatSize = (gb: number) => {
    if (gb >= 1024) {
      return (gb / 1024).toFixed(2) + ' TB'
    }
    return gb.toFixed(2) + ' GB'
  }

  const stats = computed<StatCard[]>(() => [
    { title: '已用存储', value: formatSize(storageStats.value.usedStorage), color: 'text-purple-400' },
    { title: '总存储', value: formatSize(storageStats.value.totalStorage), color: 'text-blue-400' },
    { title: 'R2存储桶', value: storageStats.value.r2Buckets.toString(), color: 'text-green-400' },
  ])

  const addLog = (action: string, user: string, status: SystemLog['status'], details?: string, fileName?: string) => {
    logs.value.unshift({
      id: Date.now(),
      action,
      user,
      time: new Date().toLocaleTimeString(),
      status,
      details,
      fileName
    })
  }

  const fetchUsers = async () => {
    const response = await get<User[]>('/admin/users')
    if (response.success && response.data) {
      users.value = response.data
    }
  }

  const fetchUserGroups = async () => {
    const response = await get<UserGroup[]>('/admin/groups')
    if (response.success && response.data) {
      userGroups.value = response.data
    }
  }

  const fetchStorageStats = async () => {
    const response = await get<StorageStats>('/admin/stats')
    if (response.success && response.data) {
      storageStats.value = {
        totalStorage: response.data.totalStorage || 0,
        usedStorage: response.data.usedStorage || 0,
        availableStorage: response.data.availableStorage || 0,
        r2Buckets: response.data.r2Buckets || 0,
        totalFiles: response.data.totalFiles || 0,
        totalSize: response.data.totalSize || 0
      }
    }
  }

  const fetchLogs = async () => {
    const response = await get<SystemLog[]>('/admin/logs')
    if (response.success && response.data) {
      logs.value = response.data
    }
  }

  const addUser = async (userData: { name: string; email: string; password: string; role?: 'admin' | 'user'; storageQuota?: number; groupId?: string }) => {
    const response = await post<User>('/admin/users', userData)
    if (response.success && response.data) {
      users.value.push(response.data)
      addLog('添加用户', 'admin', '成功', `新用户: ${response.data.name}`)
      return { success: true, user: response.data }
    }
    return { success: false, error: response.error || '添加用户失败' }
  }

  const updateUser = async (userId: string, updates: Partial<User>) => {
    const response = await put(`/admin/users/${userId}`, updates)
    if (response.success) {
      const user = users.value.find(u => u.id === userId)
      if (user) {
        Object.assign(user, updates)
        addLog('编辑用户', 'admin', '成功', `用户ID: ${userId}`)
      }
      return { success: true }
    }
    return { success: false, error: response.error || '更新用户失败' }
  }

  const deleteUser = async (userId: string) => {
    const response = await del(`/admin/users/${userId}`)
    if (response.success) {
      const user = users.value.find(u => u.id === userId)
      if (user) {
        users.value = users.value.filter(u => u.id !== userId)
        addLog('删除用户', 'admin', '成功', `已删除用户: ${user.name}`)
      }
      return { success: true }
    }
    return { success: false, error: response.error || '删除用户失败' }
  }

  const addGroup = async (groupData: Omit<UserGroup, 'id'>) => {
    const response = await post<UserGroup>('/admin/groups', groupData)
    if (response.success && response.data) {
      userGroups.value.push(response.data)
      addLog('添加用户组', 'admin', '成功', `新用户组: ${response.data.name}`)
      return { success: true, group: response.data }
    }
    return { success: false, error: response.error || '添加用户组失败' }
  }

  const updateGroup = async (groupId: string, updates: Partial<UserGroup>) => {
    const response = await put(`/admin/groups/${groupId}`, updates)
    if (response.success) {
      const group = userGroups.value.find(g => g.id === groupId)
      if (group) {
        Object.assign(group, updates)
        addLog('编辑用户组', 'admin', '成功', `用户组ID: ${groupId}`)
      }
      return { success: true }
    }
    return { success: false, error: response.error || '更新用户组失败' }
  }

  const deleteGroup = async (groupId: string) => {
    const response = await del(`/admin/groups/${groupId}`)
    if (response.success) {
      const group = userGroups.value.find(g => g.id === groupId)
      if (group) {
        userGroups.value = userGroups.value.filter(g => g.id !== groupId)
        addLog('删除用户组', 'admin', '成功', `已删除用户组: ${group.name}`)
      }
      return { success: true }
    }
    return { success: false, error: response.error || '删除用户组失败' }
  }

  const updateStorageStats = (stats: Partial<StorageStats>) => {
    Object.assign(storageStats.value, stats)
  }

  const updateUserQuota = async (userId: string, quota: number) => {
    const response = await put(`/admin/users/${userId}`, { storageQuota: quota })
    if (response.success) {
      const user = users.value.find(u => u.id === userId)
      if (user) {
        user.storageQuota = quota
        addLog('更新存储配额', 'admin', '成功', `用户: ${user.name}, 配额: ${quota}GB`)
      }
      return { success: true }
    }
    return { success: false, error: response.error || '更新存储配额失败' }
  }

  const initData = async () => {
    await Promise.all([
      fetchUsers(),
      fetchUserGroups(),
      fetchStorageStats(),
      fetchLogs()
    ])
  }

  return {
    users,
    userGroups,
    logs,
    storageStats,
    stats,
    addLog,
    fetchUsers,
    fetchUserGroups,
    fetchStorageStats,
    fetchLogs,
    addUser,
    updateUser,
    deleteUser,
    addGroup,
    updateGroup,
    deleteGroup,
    updateStorageStats,
    updateUserQuota,
    initData
  }
})

