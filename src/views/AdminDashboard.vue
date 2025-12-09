<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useAdminStore } from '../stores'
import type { MenuItem, User } from '../types'
import PageFrame from '../components/PageFrame.vue'
import Sidebar from '../components/Sidebar.vue'
import StatCardComponent from '../components/StatCard.vue'
import UserTable from '../components/UserTable.vue'
import FileTable from '../components/FileTable.vue'
import LogTable from '../components/LogTable.vue'
import StorageManagement from '../components/StorageManagement.vue'
import UserGroupManagement from '../components/UserGroupManagement.vue'
import BaseButton from '../components/BaseButton.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import type { UserGroup } from '../types'

const router = useRouter()
const authStore = useAuthStore()
const adminStore = useAdminStore()

const activeTab = ref('dashboard')
const isLoading = ref(false)

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: '仪表盘', icon: 'home' },
  { id: 'storage', label: '存储管理', icon: 'storage' },
  { id: 'users', label: '用户管理', icon: 'users' },
  { id: 'groups', label: '用户组', icon: 'groups' },
  { id: 'files', label: '文件管理', icon: 'files' },
  { id: 'logs', label: '系统日志', icon: 'logs' },
]

const stats = computed(() => adminStore.stats)
const users = computed(() => adminStore.users)
const userGroups = computed(() => adminStore.userGroups)
const storageStats = computed(() => adminStore.storageStats)
const logs = computed(() => adminStore.logs)

const files = ref<any[]>([])

const pageTitle = computed(() => menuItems.find(item => item.id === activeTab.value)?.label || '管理面板')

const formatSize = (gb: number) => {
  if (gb >= 1024) {
    return (gb / 1024).toFixed(2) + ' TB'
  }
  return gb.toFixed(2) + ' GB'
}

const initAdminData = async () => {
  isLoading.value = true
  try {
    await adminStore.initData()
  } catch (error) {
    // 初始化失败，静默处理
  } finally {
    isLoading.value = false
  }
}


const addUser = async () => {
  const name = prompt('请输入用户名:')
  if (!name || !name.trim()) return
  
  const email = prompt('请输入邮箱:', name.trim() + '@simpleshare.com')
  if (!email || !email.trim()) return
  
  const password = prompt('请输入密码（至少6位）:')
  if (!password || password.length < 6) {
    alert('密码长度至少为6位')
    return
  }
  
  isLoading.value = true
  try {
    const result = await adminStore.addUser({
      name: name.trim(),
      email: email.trim(),
      password,
      role: 'user',
      storageQuota: 50
    })
    if (!result.success) {
      alert(result.error || '添加用户失败')
    }
  } catch (error) {
    alert('添加用户失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const editUser = async (user: User) => {
  const newName = prompt(`编辑用户名 "${user.name}":`, user.name)
  if (!newName || !newName.trim() || newName === user.name) return
  
  isLoading.value = true
  try {
    const result = await adminStore.updateUser(user.id, {
      name: newName.trim()
    })
    if (!result.success) {
      alert(result.error || '更新用户失败')
    }
  } catch (error) {
    alert('更新用户失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const deleteUser = async (user: User) => {
  if (!confirm(`确定要删除用户 "${user.name}" 吗？此操作不可恢复。`)) return
  
  isLoading.value = true
  try {
    const result = await adminStore.deleteUser(user.id)
    if (!result.success) {
      alert(result.error || '删除用户失败')
    }
  } catch (error) {
    alert('删除用户失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const viewFile = (file: any) => {
  alert(`文件详情:\n\n文件名: ${file.name}\n上传者: ${file.uploader}\n大小: ${file.size}\n上传日期: ${file.uploaded}`)
}

const deleteFile = async (file: any) => {
  if (confirm(`确定要删除文件 "${file.name}" 吗？此操作不可恢复。`)) {
    isLoading.value = true
    await new Promise(resolve => setTimeout(resolve, 500))
    files.value = files.value.filter(f => f.id !== file.id)
    adminStore.addLog('删除文件', 'admin', '成功', '管理员强制删除', file.name)
    isLoading.value = false
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}

const handleAddGroup = async (group: Omit<UserGroup, 'id'>) => {
  isLoading.value = true
  try {
    const result = await adminStore.addGroup(group)
    if (!result.success) {
      alert(result.error || '添加用户组失败')
    }
  } catch (error) {
    alert('添加用户组失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const handleEditGroup = async (id: string, updates: Partial<UserGroup>) => {
  isLoading.value = true
  try {
    const result = await adminStore.updateGroup(id, updates)
    if (!result.success) {
      alert(result.error || '更新用户组失败')
    }
  } catch (error) {
    alert('更新用户组失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const handleDeleteGroup = async (id: string) => {
  const group = adminStore.userGroups.find(g => g.id === id)
  if (!group || !confirm(`确定要删除用户组 "${group.name}" 吗？此操作不可恢复。`)) return
  
  isLoading.value = true
  try {
    const result = await adminStore.deleteGroup(id)
    if (!result.success) {
      alert(result.error || '删除用户组失败')
    }
  } catch (error) {
    alert('删除用户组失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const handleUpdateQuota = async (userId: string, quota: number) => {
  isLoading.value = true
  try {
    const result = await adminStore.updateUserQuota(userId, quota)
    if (!result.success) {
      alert(result.error || '更新存储配额失败')
    }
  } catch (error) {
    alert('更新存储配额失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}


onMounted(() => {
  authStore.initAuth()
  initAdminData()
})
</script>

<template>
  <PageFrame no-padding :allow-overflow="false" :full-screen="true">
    <div class="absolute inset-0 flex flex-col md:flex-row overflow-hidden">
      <Sidebar
        :menu-items="menuItems"
        :active-tab="activeTab"
        username="管理员"
        user-role="超级权限"
        logo="A"
        logo-color="red"
        @tab-change="activeTab = $event"
        @logout="handleLogout"
      >
        <template #title>管理面板</template>
      </Sidebar>

      <main class="flex-1 flex flex-col h-full overflow-hidden bg-slate-900/20 relative min-w-0">
        <header class="h-16 md:h-20 shrink-0 border-b border-white/5 flex items-center justify-between px-4 md:px-8">
          <h1 class="text-xl font-bold text-white">{{ pageTitle }}</h1>
          <BaseButton
            v-if="activeTab === 'users'"
            variant="primary"
            class="!py-1.5 !px-3 !text-xs"
            @click="addUser"
          >
            <svg class="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            添加用户
          </BaseButton>
        </header>

        <div class="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent relative">
          <div v-if="isLoading" class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <LoadingSpinner size="lg" text="处理中..." />
          </div>

          <!-- 仪表盘视图 -->
          <div v-if="activeTab === 'dashboard'" class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCardComponent v-for="stat in stats" :key="stat.title" :stat="stat" />
            </div>
            <div class="bg-white/5 border border-white/5 rounded-2xl p-6">
              <h3 class="text-lg font-bold text-white mb-4">系统概览</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div class="flex justify-between items-center">
                  <span class="text-slate-400">总用户数</span>
                  <span class="text-white font-bold">{{ users.length }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-400">活跃用户</span>
                  <span class="text-green-400 font-bold">{{ users.filter(u => u.status === '活跃').length }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-400">用户组数</span>
                  <span class="text-white font-bold">{{ userGroups.length }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-400">总文件数</span>
                  <span class="text-white font-bold">{{ storageStats.totalFiles.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-400">可用存储</span>
                  <span class="text-green-400 font-bold">{{ formatSize(storageStats.availableStorage) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-400">系统日志</span>
                  <span class="text-white font-bold">{{ logs.length }} 条</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 存储管理视图 -->
          <div v-if="activeTab === 'storage'">
            <StorageManagement :stats="storageStats" @refresh="() => {}" />
          </div>

          <!-- 用户管理视图 -->
          <div v-if="activeTab === 'users'">
            <UserTable 
              v-if="users.length > 0" 
              :users="users" 
              :groups="userGroups.map(g => ({ id: g.id, name: g.name }))"
              @edit="editUser" 
              @delete="deleteUser"
              @update-quota="handleUpdateQuota"
            />
            <EmptyState
              v-else
              icon="user"
              title="暂无用户"
              description="系统中还没有任何用户"
              action-label="添加用户"
              @action="addUser"
            />
          </div>

          <!-- 用户组管理视图 -->
          <div v-if="activeTab === 'groups'">
            <UserGroupManagement
              :groups="userGroups"
              @add="handleAddGroup"
              @edit="handleEditGroup"
              @delete="handleDeleteGroup"
            />
          </div>

          <!-- 文件管理视图 -->
          <div v-if="activeTab === 'files'">
            <FileTable v-if="files.length > 0" :files="files" @view="viewFile" @delete="deleteFile" />
            <EmptyState
              v-else
              icon="file"
              title="暂无文件"
              description="系统中还没有任何文件"
            />
          </div>

          <!-- 系统日志视图 -->
          <div v-if="activeTab === 'logs'">
            <LogTable v-if="logs.length > 0" :logs="logs" />
            <EmptyState
              v-else
              icon="search"
              title="暂无日志"
              description="系统中还没有任何日志记录"
            />
          </div>
        </div>
      </main>
    </div>
  </PageFrame>
</template>
