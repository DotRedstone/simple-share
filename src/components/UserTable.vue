<script setup lang="ts">
import type { User } from '../types'
import UserStorageQuota from './UserStorageQuota.vue'

const props = defineProps<{
  users: User[]
  groups?: Array<{ id: string; name: string }>
}>()

const emit = defineEmits<{
  (e: 'edit', user: User): void
  (e: 'delete', user: User): void
  (e: 'update-quota', userId: string, quota: number): void
}>()

const getGroupName = (groupId?: string) => {
  if (!groupId || !props.groups) return '-'
  const group = props.groups.find(g => g.id === groupId)
  return group?.name || '-'
}
</script>

<template>
  <div class="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
    <div class="overflow-x-auto -mx-4 md:mx-0">
      <table class="w-full text-left text-sm text-slate-400 min-w-[600px]">
        <thead class="bg-black/20 text-xs uppercase font-bold tracking-wider">
          <tr>
            <th class="px-3 md:px-6 py-4">用户</th>
            <th class="px-3 md:px-6 py-4 hidden md:table-cell">用户组</th>
            <th class="px-3 md:px-6 py-4 hidden lg:table-cell">存储</th>
            <th class="px-3 md:px-6 py-4">状态</th>
            <th class="px-3 md:px-6 py-4 text-right">操作</th>
          </tr>
        </thead>
      <tbody class="divide-y divide-white/5">
        <tr v-for="user in users" :key="user.id" class="hover:bg-white/5 transition-colors">
          <td class="px-3 md:px-6 py-4 font-medium text-white min-w-0">
            <div class="font-bold truncate">{{ user.name }}</div>
            <div class="text-xs text-slate-500 truncate">{{ user.email }}</div>
          </td>
          <td class="px-3 md:px-6 py-4 hidden md:table-cell text-slate-400">
            {{ getGroupName(user.groupId) }}
          </td>
          <td class="px-3 md:px-6 py-4 hidden lg:table-cell">
            <UserStorageQuota :user="user" @update-quota="(id, quota) => emit('update-quota', id, quota)" />
          </td>
          <td class="px-3 md:px-6 py-4">
            <span
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              :class="user.status === '活跃' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'"
            >
              {{ user.status }}
            </span>
          </td>
          <td class="px-6 py-4 text-right">
            <div class="flex gap-1 justify-end">
              <button
                @click="emit('edit', user)"
                class="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                title="编辑"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 5.232z" />
                </svg>
              </button>
              <button
                @click="emit('delete', user)"
                class="p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                title="删除"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
      </table>
    </div>
  </div>
</template>

