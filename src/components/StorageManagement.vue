<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { StorageStats } from '../types'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import BaseModal from './BaseModal.vue'
import BaseCheckbox from './BaseCheckbox.vue'
import { api } from '../api'

const props = defineProps<{
  stats: StorageStats
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

interface StorageBackend {
  id: string
  name: string
  type: 'r2' | 's3' | 'webdav' | 'ftp' | 'sftp'
  enabled: boolean
  isDefault: boolean
  description?: string
  config: any
  createdAt: number
  updatedAt: number
}

const storageBackends = ref<StorageBackend[]>([])
const isLoading = ref(false)
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingBackend = ref<StorageBackend | null>(null)

// 表单数据
const formData = ref({
  name: '',
  type: 'r2' as 'r2' | 's3' | 'webdav' | 'ftp' | 'sftp',
  description: '',
  enabled: true,
  isDefault: false,
  quotaGb: 0, // 0 表示无限制
  // R2 配置
  r2Bucket: '',
  r2AccountId: '',
  // S3 配置
  endpoint: '',
  region: 'us-east-1',
  accessKeyId: '',
  secretAccessKey: '',
  bucketName: '',
  forcePathStyle: false,
  publicUrl: '',
  // WebDAV 配置
  webdavUrl: '',
  // FTP/SFTP 配置
  host: '',
  port: 21,
  username: '',
  password: '',
  basePath: ''
})

const storagePercentage = computed(() => {
  return props.stats.totalStorage > 0 
    ? (props.stats.usedStorage / props.stats.totalStorage * 100).toFixed(1)
    : '0'
})

const formatSize = (gb: number) => {
  if (gb >= 1024) {
    return (gb / 1024).toFixed(2) + ' TB'
  }
  return gb.toFixed(2) + ' GB'
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    r2: 'Cloudflare R2',
    s3: 'AWS S3',
    webdav: 'WebDAV (AList/OpenList)',
    ftp: 'FTP',
    sftp: 'SFTP'
  }
  return labels[type] || type
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    r2: 'text-orange-400',
    s3: 'text-blue-400',
    webdav: 'text-purple-400',
    ftp: 'text-green-400',
    sftp: 'text-cyan-400'
  }
  return colors[type] || 'text-slate-400'
}

const loadStorageBackends = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/admin/storage')
    if (response.data.success) {
      storageBackends.value = response.data.data
    }
  } catch (error) {
    console.error('加载存储后端失败:', error)
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    name: '',
    type: 'r2',
    description: '',
    enabled: true,
    isDefault: false,
    quotaGb: 0,
    r2Bucket: '',
    r2AccountId: '',
    endpoint: '',
    region: 'us-east-1',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
    forcePathStyle: false,
    publicUrl: '',
    webdavUrl: '',
    host: '',
    port: 21,
    username: '',
    password: '',
    basePath: ''
  }
  editingBackend.value = null
}

const openAddModal = () => {
  resetForm()
  showAddModal.value = true
}

const openEditModal = (backend: StorageBackend) => {
  editingBackend.value = backend
  formData.value = {
    name: backend.name,
    type: backend.type,
    description: backend.description || '',
    enabled: backend.enabled,
    isDefault: backend.isDefault,
    quotaGb: backend.config.quotaGb || 0,
    r2Bucket: backend.config.bucket || backend.config.bucketName || '',
    r2AccountId: backend.config.accountId || '',
    endpoint: backend.config.endpoint || '',
    region: backend.config.region || 'us-east-1',
    accessKeyId: backend.config.accessKeyId || '',
    secretAccessKey: '', // 不显示密钥
    bucketName: backend.config.bucketName || backend.config.bucket || '',
    forcePathStyle: backend.config.forcePathStyle || false,
    publicUrl: backend.config.publicUrl || '',
    webdavUrl: backend.config.webdavUrl || '',
    host: backend.config.host || '',
    port: backend.config.port || (backend.type === 'sftp' ? 22 : 21),
    username: backend.config.username || '',
    password: '', // 不显示密码
    basePath: backend.config.basePath || ''
  }
  showEditModal.value = true
}

const buildConfig = () => {
  const config: any = {
    quotaGb: formData.value.quotaGb
  }
  
  if (formData.value.type === 'r2') {
    config.bucket = formData.value.r2Bucket
    config.publicUrl = formData.value.publicUrl
    if (formData.value.r2AccountId) {
      config.accountId = formData.value.r2AccountId
    }
  } else if (formData.value.type === 's3') {
    config.endpoint = formData.value.endpoint
    config.region = formData.value.region
    config.accessKeyId = formData.value.accessKeyId
    config.forcePathStyle = formData.value.forcePathStyle
    config.publicUrl = formData.value.publicUrl
    if (formData.value.secretAccessKey) {
      config.secretAccessKey = formData.value.secretAccessKey
    }
    config.bucketName = formData.value.bucketName
  } else if (formData.value.type === 'webdav') {
    config.webdavUrl = formData.value.webdavUrl
    config.username = formData.value.username
    config.password = formData.value.password
    if (formData.value.basePath) {
      config.basePath = formData.value.basePath
    }
  } else if (formData.value.type === 'ftp' || formData.value.type === 'sftp') {
    config.host = formData.value.host
    config.port = formData.value.port
    config.username = formData.value.username
    config.password = formData.value.password
    config.basePath = formData.value.basePath
  }
  
  return config
}

const handleSave = async () => {
  if (!formData.value.name.trim()) {
    alert('请输入存储后端名称')
    return
  }

  isLoading.value = true
  try {
    const config = buildConfig()
    const payload = {
      name: formData.value.name.trim(),
      type: formData.value.type,
      description: formData.value.description.trim() || undefined,
      enabled: formData.value.enabled,
      isDefault: formData.value.isDefault,
      config
    }

    if (editingBackend.value) {
      await api.put(`/admin/storage/${editingBackend.value.id}`, payload)
    } else {
      await api.post('/admin/storage', payload)
    }

    showAddModal.value = false
    showEditModal.value = false
    resetForm()
    await loadStorageBackends()
    emit('refresh')
  } catch (error: any) {
    alert(error.response?.data?.error || '保存失败')
  } finally {
    isLoading.value = false
  }
}

const handleDelete = async (backend: StorageBackend) => {
  if (!confirm(`确定要删除存储后端 "${backend.name}" 吗？`)) {
    return
  }

  isLoading.value = true
  try {
    await api.delete(`/admin/storage/${backend.id}`)
    await loadStorageBackends()
    emit('refresh')
  } catch (error: any) {
    alert(error.response?.data?.error || '删除失败')
  } finally {
    isLoading.value = false
  }
}

const toggleEnabled = async (backend: StorageBackend) => {
  isLoading.value = true
  try {
    await api.put(`/admin/storage/${backend.id}`, {
      enabled: !backend.enabled
    })
    await loadStorageBackends()
    emit('refresh')
  } catch (error: any) {
    alert(error.response?.data?.error || '更新失败')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadStorageBackends()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 存储概览 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white/5 border border-white/10 rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-400 uppercase">总存储</span>
          <svg class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        </div>
        <p class="text-2xl font-mono text-white">{{ formatSize(stats.totalStorage) }}</p>
      </div>

      <div class="bg-white/5 border border-white/10 rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-400 uppercase">已用存储</span>
          <svg class="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p class="text-2xl font-mono text-purple-400">{{ formatSize(stats.usedStorage) }}</p>
      </div>

      <div class="bg-white/5 border border-white/10 rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-400 uppercase">可用存储</span>
          <svg class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-2xl font-mono text-green-400">{{ formatSize(stats.availableStorage) }}</p>
      </div>
    </div>

    <!-- 存储使用进度 -->
    <div class="bg-white/5 border border-white/10 rounded-xl p-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-bold text-white">存储使用情况</h3>
        <span class="text-sm text-slate-400">{{ storagePercentage }}%</span>
      </div>
      <div class="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
          :style="{ width: storagePercentage + '%' }"
        ></div>
      </div>
      <div class="flex justify-between items-center mt-2 text-xs text-slate-500">
        <span>{{ formatSize(stats.usedStorage) }} 已使用</span>
        <span>{{ formatSize(stats.availableStorage) }} 可用</span>
      </div>
    </div>

    <!-- 存储后端列表 -->
    <div class="bg-white/5 border border-white/10 rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-white">存储后端</h3>
        <BaseButton variant="primary" @click="openAddModal">
          <svg class="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          添加存储后端
        </BaseButton>
      </div>

      <div v-if="isLoading" class="text-center py-8 text-slate-400">加载中...</div>
      <div v-else-if="storageBackends.length === 0" class="text-center py-8 text-slate-400">
        暂无存储后端，点击上方按钮添加
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="backend in storageBackends"
          :key="backend.id"
          class="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span :class="['font-bold text-white', getTypeColor(backend.type)]">
                  {{ getTypeLabel(backend.type) }}
                </span>
                <span class="text-white font-semibold">{{ backend.name }}</span>
                <span
                  v-if="backend.isDefault"
                  class="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded"
                >
                  默认
                </span>
                <span
                  v-if="!backend.enabled"
                  class="text-xs bg-slate-500/20 text-slate-300 px-2 py-0.5 rounded"
                >
                  已禁用
                </span>
              </div>
              <p v-if="backend.description" class="text-sm text-slate-400 mb-2">
                {{ backend.description }}
              </p>
              <div class="text-xs text-slate-500">
                创建于 {{ new Date(backend.createdAt * 1000).toLocaleString() }}
                <template v-if="backend.config.quotaGb">
                  · 配额 {{ backend.config.quotaGb }} GB
                </template>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <BaseButton
                variant="glass"
                class="!py-1 !px-2 !text-xs"
                @click="toggleEnabled(backend)"
              >
                {{ backend.enabled ? '禁用' : '启用' }}
              </BaseButton>
              <BaseButton
                variant="glass"
                class="!py-1 !px-2 !text-xs"
                @click="openEditModal(backend)"
              >
                编辑
              </BaseButton>
                <BaseButton
                  variant="glass"
                  class="!py-1 !px-2 !text-xs text-red-400"
                  @click="handleDelete(backend)"
                  :disabled="backend.isDefault || backend.id === 'system_r2'"
                >
                  删除
                </BaseButton>
            </div>
        </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑模态框 -->
    <BaseModal
      :show="showAddModal || showEditModal"
      :title="editingBackend ? '编辑存储后端' : '添加存储后端'"
      width="max-w-2xl"
      @close="showAddModal = false; showEditModal = false; resetForm()"
    >
      <div class="space-y-4">
        <BaseInput
          v-model="formData.name"
          label="名称"
          placeholder="例如：主存储"
          required
        />
        
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">类型</label>
          <select
            v-model="formData.type"
            class="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="!!editingBackend"
          >
            <option value="r2">Cloudflare R2</option>
            <option value="s3">AWS S3 / S3 兼容对象存储</option>
            <option value="webdav">WebDAV (AList/OpenList)</option>
            <option value="ftp">FTP</option>
            <option value="sftp">SFTP</option>
          </select>
        </div>

        <BaseInput
          v-model="formData.description"
          label="描述"
          placeholder="可选"
        />

        <BaseInput
          v-model.number="formData.quotaGb"
          label="存储后端总配额 (GB)"
          type="number"
          placeholder="0 表示不限制，建议设置以避免额外费用"
          :min="0"
        />

        <!-- R2 配置 -->
        <template v-if="formData.type === 'r2'">
          <BaseInput
            v-model="formData.r2Bucket"
            label="存储桶名称"
            placeholder="simpleshare-files"
            required
          />
          <BaseInput
            v-model="formData.r2AccountId"
            label="账户 ID（可选）"
            placeholder="Cloudflare Account ID"
          />
          <BaseInput
            v-model="formData.publicUrl"
            label="自定义公网访问 URL（可选）"
            placeholder="https://pub-xxx.r2.dev 或 https://cdn.yourdomain.com"
          />
        </template>

        <!-- S3 配置 -->
        <template v-else-if="formData.type === 's3'">
          <BaseInput
            v-model="formData.endpoint"
            label="端点 URL"
            placeholder="https://s3.amazonaws.com"
            required
          />
          <BaseInput
            v-model="formData.region"
            label="区域"
            placeholder="us-east-1"
            required
          />
          <BaseInput
            v-model="formData.bucketName"
            label="存储桶名称"
            placeholder="my-bucket"
            required
          />
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput
              v-model="formData.accessKeyId"
              label="Access Key ID"
              placeholder="AKIA..."
              required
            />
            <BaseInput
              v-model="formData.secretAccessKey"
              label="Secret Access Key"
              type="password"
              placeholder="留空则不更新"
              :required="!editingBackend"
            />
          </div>
          <BaseInput
            v-model="formData.publicUrl"
            label="自定义公网访问 URL（可选）"
            placeholder="https://cdn.yourdomain.com"
          />
          <BaseCheckbox
            v-model="formData.forcePathStyle"
            label="强制路径样式 (Force Path Style)"
          />
          <div class="text-xs text-slate-400 mt-1">
            提示：MinIO 或某些私有云对象存储通常需要开启此选项。
          </div>
        </template>

        <!-- WebDAV 配置 -->
        <template v-else-if="formData.type === 'webdav'">
          <BaseInput
            v-model="formData.webdavUrl"
            label="WebDAV URL"
            placeholder="https://alist.example.com/dav 或 https://your-webdav-server.com"
            required
          />
          <BaseInput
            v-model="formData.username"
            label="用户名"
            placeholder="webdav-username"
            required
          />
          <BaseInput
            v-model="formData.password"
            label="密码"
            type="password"
            placeholder="留空则不更新"
            :required="!editingBackend"
          />
          <BaseInput
            v-model="formData.basePath"
            label="基础路径（可选）"
            placeholder="/files 或留空使用根目录"
          />
          <div class="text-xs text-slate-400 mt-1">
            提示：适用于 AList、OpenList 等支持 WebDAV 的网盘挂载服务
          </div>
        </template>

        <!-- FTP/SFTP 配置 -->
        <template v-else-if="formData.type === 'ftp' || formData.type === 'sftp'">
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2">
              <BaseInput
                v-model="formData.host"
                label="服务器地址"
                placeholder="ftp.example.com"
                required
              />
            </div>
            <div>
              <BaseInput
                v-model.number="formData.port"
                label="端口"
                type="number"
                placeholder="21"
                required
              />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput
              v-model="formData.username"
              label="用户名"
              placeholder="ftp-user"
              required
            />
            <BaseInput
              v-model="formData.password"
              label="密码"
              type="password"
              placeholder="留空则不更新"
              :required="!editingBackend"
            />
          </div>
          <BaseInput
            v-model="formData.basePath"
            label="远程路径"
            placeholder="/uploads 或留空使用根目录"
          />
        </template>

        <div class="flex items-center gap-4">
          <BaseCheckbox
            v-model="formData.enabled"
            label="启用"
          />
          <BaseCheckbox
            v-model="formData.isDefault"
            label="设为默认"
          />
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <BaseButton
            variant="glass"
            @click="showAddModal = false; showEditModal = false; resetForm()"
            :disabled="isLoading"
          >
            取消
          </BaseButton>
          <BaseButton
            variant="primary"
            @click="handleSave"
            :loading="isLoading"
            :disabled="isLoading"
          >
            保存
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
