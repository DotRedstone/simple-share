<script setup lang="ts">
import { useShareStore } from '../stores'

const shareStore = useShareStore()

interface File {
  id: string | number
  name: string
  uploader: string
  size: string
  size_bytes: number
  uploaded: string
  type: string
  status?: string
}

const props = defineProps<{
  files: File[]
  sortBy?: string
  order?: 'ASC' | 'DESC'
}>()

const emit = defineEmits<{
  (e: 'view', file: File): void
  (e: 'delete', file: File): void
  (e: 'takedown', file: File): void
  (e: 'sort', field: string): void
}>()

const getShareInfo = (fileId: string | number) => {
  const idStr = String(fileId)
  const fileIdNum = parseInt(idStr.replace('file_', ''))
  return shareStore.getShareByFileId(fileIdNum)
}

const getSortIcon = (field: string) => {
  if (props.sortBy !== field) return '↕'
  return props.order === 'ASC' ? '↑' : '↓'
}
</script>

<template>
  <div class="glass-card rounded-2xl sm:rounded-[2rem] overflow-hidden border border-white/5">
    <div class="overflow-x-auto scrollbar-hide sm:scrollbar-default">
      <table class="w-full text-left text-sm text-slate-400 table-fixed min-w-[800px] sm:min-w-[900px]">
        <thead class="bg-white/5 text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 border-b border-white/5">
          <tr>
            <th class="px-4 sm:px-8 py-4 sm:py-5 cursor-pointer hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors w-[30%] sm:w-[35%]" @click="emit('sort', 'name')">
              文件名 {{ getSortIcon('name') }}
            </th>
            <th class="px-4 sm:px-8 py-4 sm:py-5 cursor-pointer hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors w-20 sm:w-24" @click="emit('sort', 'type')">
              类型 {{ getSortIcon('type') }}
            </th>
            <th class="px-4 sm:px-8 py-4 sm:py-5 cursor-pointer hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors w-28 sm:w-32" @click="emit('sort', 'user_id')">
              上传者 {{ getSortIcon('user_id') }}
            </th>
            <th class="px-4 sm:px-8 py-4 sm:py-5 cursor-pointer hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors w-24 sm:w-28" @click="emit('sort', 'size_bytes')">
              大小 {{ getSortIcon('size_bytes') }}
            </th>
            <th class="px-4 sm:px-8 py-4 sm:py-5 cursor-pointer hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors w-36 sm:w-44" @click="emit('sort', 'created_at')">
              上传时间 {{ getSortIcon('created_at') }}
            </th>
            <th class="px-4 sm:px-8 py-4 sm:py-5 hidden md:table-cell w-24">状态</th>
            <th class="px-4 sm:px-8 py-4 sm:py-5 text-right w-28 sm:w-32">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr v-for="file in files" :key="file.id" class="group hover:bg-white/[0.02] dark:hover:bg-white/[0.02] light:hover:bg-slate-100 transition-colors" :class="{'opacity-60 bg-red-500/5': file.status === '违规'}">
            <td class="px-4 sm:px-8 py-4 sm:py-5 overflow-hidden">
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-surface-800 dark:bg-surface-800 light:bg-slate-200 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" :class="file.status === '违规' ? 'text-red-400' : 'text-brand-primary'">
                  <svg v-if="file.status === '违规'" class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <svg v-else class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-width="2" /></svg>
                </div>
                <div class="flex flex-col min-w-0 overflow-hidden">
                  <span class="font-bold tracking-tight truncate text-xs sm:text-sm" :class="file.status === '违规' ? 'text-red-400' : 'text-white dark:text-white light:text-slate-900'" :title="file.name">{{ file.name }}</span>
                  <span v-if="file.status === '违规'" class="text-[9px] sm:text-[10px] text-red-500 font-medium">管理员下架</span>
                </div>
              </div>
            </td>
            <td class="px-4 sm:px-8 py-4 sm:py-5">
              <span class="px-2 py-0.5 rounded bg-surface-800 dark:bg-surface-800 light:bg-slate-200 text-[9px] sm:text-[10px] font-mono text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase tracking-wider">{{ file.type }}</span>
            </td>
            <td class="px-4 sm:px-8 py-4 sm:py-5">
              <span class="px-2 py-0.5 rounded bg-surface-800 dark:bg-surface-800 light:bg-slate-200 text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-400 light:text-slate-600 truncate block">{{ file.uploader }}</span>
            </td>
            <td class="px-4 sm:px-8 py-4 sm:py-5">
              <span class="font-mono text-[10px] sm:text-xs opacity-60 text-slate-400 dark:text-slate-400 light:text-slate-500">{{ file.size }}</span>
            </td>
            <td class="px-4 sm:px-8 py-4 sm:py-5 text-[10px] sm:text-xs opacity-60 text-slate-400 dark:text-slate-400 light:text-slate-500">{{ file.uploaded }}</td>
            <td class="px-4 sm:px-8 py-4 sm:py-5 hidden md:table-cell">
              <div v-if="file.status === '违规'" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                Violated
              </div>
              <div v-else-if="getShareInfo(file.id)" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                Active
              </div>
              <span v-else class="text-[10px] font-bold uppercase tracking-widest text-slate-600">Private</span>
            </td>
            <td class="px-4 sm:px-8 py-4 sm:py-5 text-right">
              <div class="flex gap-1 sm:gap-2 justify-end">
                <button
                  v-if="file.status !== '违规'"
                  @click="emit('takedown', file)"
                  class="p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-amber-500 hover:bg-amber-500/10 transition-all"
                  title="违规下架"
                >
                  <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </button>
                <button
                  @click="emit('delete', file)"
                  class="p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                  title="永久删除"
                >
                  <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
