<script setup lang="ts">
import { ref } from 'vue'
import type { UserGroup } from '../types'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import BaseModal from './BaseModal.vue'

defineProps<{
  groups: UserGroup[]
}>()

const emit = defineEmits<{
  (e: 'add', group: Omit<UserGroup, 'id'>): void
  (e: 'edit', id: string, group: Partial<UserGroup>): void
  (e: 'delete', id: string): void
}>()

const showAddModal = ref(false)
const showEditModal = ref(false)
const editingGroup = ref<UserGroup | null>(null)

const newGroup = ref({
  name: '',
  description: '',
  storageQuota: 10,
  maxUsers: 100,
  permissions: [] as string[]
})

const openAddModal = () => {
  newGroup.value = {
    name: '',
    description: '',
    storageQuota: 10,
    maxUsers: 100,
    permissions: []
  }
  showAddModal.value = true
}

const openEditModal = (group: UserGroup) => {
  editingGroup.value = {
    ...group,
    description: group.description || '',
    maxUsers: group.maxUsers || 1
  }
  showEditModal.value = true
}

const handleAdd = () => {
  emit('add', { ...newGroup.value })
  showAddModal.value = false
}

const handleEdit = () => {
  if (editingGroup.value) {
    emit('edit', editingGroup.value.id, { ...editingGroup.value })
    showEditModal.value = false
  }
}

const handleDelete = (id: string) => {
  if (confirm('确定要删除此用户组吗？')) {
    emit('delete', id)
  }
}

const formatSize = (gb: number) => {
  return gb + ' GB'
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-bold text-white">用户组管理</h3>
      <BaseButton variant="primary" class="!py-1.5 !px-3 !text-xs" @click="openAddModal">
        <svg class="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        添加用户组
      </BaseButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="group in groups"
        :key="group.id"
        class="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
      >
        <div class="flex items-start justify-between mb-3">
          <div>
            <h4 class="text-white font-bold">{{ group.name }}</h4>
            <p v-if="group.description" class="text-xs text-slate-400 mt-1">{{ group.description }}</p>
          </div>
          <div class="flex gap-1">
            <button
              @click="openEditModal(group)"
              class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              title="编辑"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 5.232z" />
              </svg>
            </button>
            <button
              @click="handleDelete(group.id)"
              class="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              title="删除"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between items-center">
            <span class="text-slate-400">存储配额</span>
            <span class="text-white font-mono">{{ formatSize(group.storageQuota) }}</span>
          </div>
          <div v-if="group.maxUsers" class="flex justify-between items-center">
            <span class="text-slate-400">最大用户数</span>
            <span class="text-white">{{ group.maxUsers }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加用户组模态框 -->
    <BaseModal :show="showAddModal" title="添加用户组" width="max-w-md" @close="showAddModal = false">
      <div class="space-y-4">
        <BaseInput v-model="newGroup.name" label="组名称" placeholder="例如：标准用户组" />
        <BaseInput v-model="newGroup.description" label="描述" placeholder="用户组描述" />
        <BaseInput v-model.number="newGroup.storageQuota" type="number" label="存储配额 (GB)" :min="1" />
        <BaseInput v-model.number="newGroup.maxUsers" type="number" label="最大用户数" :min="1" />
        <div class="flex justify-end gap-3">
          <BaseButton variant="glass" @click="showAddModal = false">取消</BaseButton>
          <BaseButton variant="primary" @click="handleAdd">添加</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- 编辑用户组模态框 -->
    <BaseModal :show="showEditModal" title="编辑用户组" width="max-w-md" @close="showEditModal = false">
      <div v-if="editingGroup" class="space-y-4">
        <BaseInput v-model="editingGroup.name" label="组名称" />
        <BaseInput :model-value="editingGroup.description || ''" @update:model-value="(val) => editingGroup && (editingGroup.description = val)" label="描述" />
        <BaseInput v-model.number="editingGroup.storageQuota" type="number" label="存储配额 (GB)" :min="1" />
        <BaseInput :model-value="editingGroup.maxUsers || 1" @update:model-value="(val) => editingGroup && (editingGroup.maxUsers = Number(val))" type="number" label="最大用户数" :min="1" />
        <div class="flex justify-end gap-3">
          <BaseButton variant="glass" @click="showEditModal = false">取消</BaseButton>
          <BaseButton variant="primary" @click="handleEdit">保存</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

