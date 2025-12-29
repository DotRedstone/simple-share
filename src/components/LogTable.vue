<script setup lang="ts">
import type { SystemLog } from '../types'

const props = defineProps<{
  logs: SystemLog[]
  sortBy?: string
  order?: 'ASC' | 'DESC'
}>()

const emit = defineEmits<{
  (e: 'sort', field: string): void
}>()

const getSortIcon = (field: string) => {
  if (props.sortBy !== field) return '↕'
  return props.order === 'ASC' ? '↑' : '↓'
}
</script>

<template>
  <div class="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
    <table class="w-full text-left font-mono text-sm text-slate-400">
      <thead class="bg-black/20 text-xs uppercase font-bold tracking-wider">
        <tr>
          <th class="px-6 py-3 whitespace-nowrap cursor-pointer hover:text-white transition-colors" @click="emit('sort', 'created_at')">
            时间戳 {{ getSortIcon('created_at') }}
          </th>
          <th class="px-6 py-3 whitespace-nowrap min-w-[120px] cursor-pointer hover:text-white transition-colors" @click="emit('sort', 'action')">
            操作 {{ getSortIcon('action') }}
          </th>
          <th class="px-6 py-3 whitespace-nowrap cursor-pointer hover:text-white transition-colors" @click="emit('sort', 'user_name')">
            用户 {{ getSortIcon('user_name') }}
          </th>
          <th class="px-6 py-3 hidden md:table-cell">详情</th>
          <th class="px-6 py-3 text-right whitespace-nowrap cursor-pointer hover:text-white transition-colors" @click="emit('sort', 'status')">
            状态 {{ getSortIcon('status') }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        <tr v-for="log in logs" :key="log.id" class="hover:bg-white/5">
          <td class="px-6 py-3 text-slate-500">{{ log.time }}</td>
          <td class="px-6 py-3 text-white whitespace-nowrap">{{ log.action }}</td>
          <td class="px-6 py-3">{{ log.user }}</td>
          <td class="px-6 py-3 hidden md:table-cell text-slate-500 text-xs">
            <span v-if="log.fileName" class="text-slate-400">{{ log.fileName }}</span>
            <span v-else-if="log.details" class="text-slate-400">{{ log.details }}</span>
            <span v-else class="text-slate-600">-</span>
          </td>
          <td class="px-6 py-3 text-right">
            <div class="flex items-center justify-end gap-2">
              <div
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-green-400': log.status === '成功',
                  'bg-yellow-400': log.status === '警告',
                  'bg-red-400': log.status === '失败'
                }"
              ></div>
              <span class="text-xs text-slate-500 hidden sm:inline">{{ log.status }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

